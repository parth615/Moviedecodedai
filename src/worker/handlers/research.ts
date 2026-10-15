import { prisma } from '../../lib/prisma';
import { generateStructuredLLM } from '../../lib/providers/llm';
import { z } from 'zod';
import { enqueueJob, logToJob } from '../../lib/queue';
import { getSetting } from '../../lib/settings';

const ResearchSchema = z.object({
  findings: z.string().describe("A summary of evidence and factual information found."),
  angles: z.array(z.string()).describe("Different thematic angles to approach this topic."),
  confidenceScore: z.number().min(0).max(100).describe("How confident are we in the factual accuracy of this topic? (0-100)"),
  sources: z.array(z.string()).describe("List of URLs or citations used to verify the claims.")
});

export async function handleResearchTopic(data: { topicId: string }, jobId: string) {
  const { topicId } = data;
  if (!topicId) throw new Error("Missing topicId");

  const topic = await prisma.topic.findUnique({ where: { id: topicId } });
  if (!topic) throw new Error(`Topic ${topicId} not found`);

  await logToJob(jobId, `Starting research for topic: ${topic.title}`);
  
  const language = await getSetting('DEFAULT_LANGUAGE');
  const country = await getSetting('DEFAULT_COUNTRY');
  
  const systemPrompt = `You are an expert researcher, trend analyst, and fact-checker. 
Research the following topic for a short-form video.
Find current/relevant information, summarize evidence, identify factual claims, and distinguish confirmed info from theories.
Focus heavily on real-time trends: What is currently viral or highly searched regarding this topic?
Never fabricate citations. Every factual claim must have a stored source or be explicitly labeled as theory.
Only output JSON matching the schema.`;

  const userPrompt = `Topic Title: ${topic.title}
Category: ${topic.category}
Hook: ${topic.hook}
Target Audience Context: ${country === 'IN' ? 'India' : 'Global'}, Language: ${language}
Requirement: Highlight angles that are currently trending or highly relevant to this audience context. Relate facts to Indian context (e.g. Indian companies, history, culture) if audience is India.`;

  const response = await generateStructuredLLM(systemPrompt, userPrompt, ResearchSchema, 'research');
  
  // Gemini sometimes returns a decimal (e.g. 0.95) instead of 0-100. Normalize it.
  let normalizedScore = response.confidenceScore;
  if (normalizedScore <= 1 && normalizedScore > 0) {
    normalizedScore = Math.round(normalizedScore * 100);
  }
  
  await logToJob(jobId, `Research complete. Confidence: ${normalizedScore}`);

  await prisma.research.create({
    data: {
      topicId,
      findings: JSON.stringify({ findings: response.findings, angles: response.angles, sources: response.sources }),
      confidenceScore: normalizedScore,
      status: 'COMPLETED'
    }
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { status: 'RESEARCHED' }
  });

  const minConfidence = parseInt(await getSetting('MINIMUM_RESEARCH_CONFIDENCE'), 10) || 80;
  
  if (normalizedScore >= minConfidence) {
    await enqueueJob('GENERATE_SCRIPT', { topicId });
    await logToJob(jobId, `Confidence meets threshold. Enqueued GENERATE_SCRIPT.`);
  } else {
    await logToJob(jobId, `Confidence ${normalizedScore} is below threshold ${minConfidence}. Topic will not proceed.`);
  }
}
