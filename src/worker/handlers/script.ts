import { prisma } from '../../lib/prisma';
import { generateStructuredLLM } from '../../lib/providers/llm';
import { z } from 'zod';
import { enqueueJob, logToJob } from '../../lib/queue';
import { getSetting } from '../../lib/settings';

// ─── Universal Script Schema ──────────────────────────────────────────────────
const ScriptSchema = z.object({
  title: z.string().describe('Compelling video title, max 100 chars'),
  hook: z.string().describe('The first sentence spoken — must be shocking or deeply curious'),
  narration: z.string().describe('The complete narration text to be spoken by the AI voice. Must match the exact concatenation of all scenes narration.'),
  scenes: z.array(z.object({
    sceneNumber: z.number(),
    duration: z.number().describe('Estimated duration in seconds for this scene (typically 4-10 seconds)'),
    narration: z.string().describe('The portion of narration spoken during this scene. High-energy, engaging, conversational.'),
    visualPrompt: z.string().describe('A specific 3-6 word search query for high-res imagery directly illustrating this scene\'s exact subject, event, or concept (e.g. "Immortal jellyfish Turritopsis dohrnii", "Kerala red rain blood sky 2001", "Cotard delusion neurology brain scan"). Must closely depict what is spoken.'),
    visualType: z.enum(['video', 'image']).describe("'video' for specific movie/trailer clips, 'image' for science, history, psychology, facts, and illustrations")
  })),
  cta: z.string().describe('Call to action at the end'),
  description: z.string().describe('YouTube/Instagram video description, 200-300 chars'),
  hashtags: z.array(z.string()),
  wordCount: z.number(),
  claims: z.array(z.object({
    claim: z.string(),
    type: z.enum(['confirmed', 'theory', 'alleged', 'opinion']),
    source: z.string()
  }))
});

// ─── Script style by category ─────────────────────────────────────────────────
function getScriptStyle(category: string): string {
  const cat = category.toLowerCase();

  if (cat.includes('movie') || cat.includes('bollywood') || cat.includes('hollywood')) {
    return `Structure: Hook → Scene setup → Shocking interpretation → Evidence → Theory payoff → CTA
Style: Dramatic, suspenseful. Reference specific scenes, characters, directors.
Visual prompts: Specific movie scene searches (e.g. "The Dark Knight Joker bank robbery scene 1080p").`;
  }

  if (cat.includes('science') || cat.includes('space') || cat.includes('astronomy') || cat.includes('body') || cat.includes('weather')) {
    return `Structure: Hook (surprising fact) → Simple explanation → Mind-blowing implication → Real-world connection → CTA
Style: Educational but conversational. No jargon. Use analogies.
Visual prompts: Scientific graphics, animations, nature footage.`;
  }

  if (cat.includes('psychology') || cat.includes('cognitive') || cat.includes('behavior')) {
    return `Structure: Hook (relatable situation) → Name the phenomenon → Science behind it → Real-world example → Practical takeaway → CTA
Style: Personal, empathetic, slightly dramatic.
Visual prompts: Human expressions, brain graphics, relatable everyday situations.`;
  }

  if (cat.includes('business') || cat.includes('money') || cat.includes('startup')) {
    return `Structure: Hook (surprising business fact) → Company/person story → Turning point → Lesson → Money angle → CTA
Style: Analytical but engaging. Numbers make it credible.
Visual prompts: Company logos, financial graphics, founder photos (where appropriate).`;
  }

  if (cat.includes('history')) {
    return `Structure: Hook (shocking historical fact) → Context → The event → Why it was hidden or forgotten → Modern relevance → CTA
Style: Storytelling. Present tense narration for immediacy.
Visual prompts: Historical photographs, maps, era-appropriate imagery.`;
  }

  if (cat.includes('current') || cat.includes('news') || cat.includes('viral') || cat.includes('trending')) {
    return `Structure: Hook → What happened → Why it matters → Context → CTA
Style: News anchor energy but casual. Fast-paced. Every claim must be sourced.
Visual prompts: News-style graphics, relevant imagery, maps.
IMPORTANT: Label all unverified claims as ALLEGED or REPORTED. Never state rumors as facts.`;
  }

  if (cat.includes('technology') || cat.includes('ai') || cat.includes('robot')) {
    return `Structure: Hook → What the technology does → Why it's surprising → Real-world impact → Future implications → CTA
Style: Enthusiastic but grounded. Explain like the viewer is 20 years old.
Visual prompts: Tech product shots, futuristic graphics, demonstrations.`;
  }

  if (cat.includes('sports') || cat.includes('cricket')) {
    return `Structure: Hook → Setup → The key moment → Data/stats → Behind the scenes story → CTA
Style: High energy, emotional. Use specific match/player names.
Visual prompts: Match footage descriptions, player action shots, stadium scenes.`;
  }

  // Default universal structure
  return `Structure: Hook → Surprising fact → Explanation → Real-world example → Takeaway → CTA
Style: Conversational, engaging, fast-paced.
Visual prompts: Specific and relevant to each scene.`;
}

export async function handleGenerateScript(data: { topicId: string }, jobId: string) {
  const { topicId } = data;
  if (!topicId) throw new Error('Missing topicId');

  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: { research: true }
  });

  if (!topic) throw new Error(`Topic ${topicId} not found`);
  if (!topic.research) throw new Error(`Research for Topic ${topicId} not found`);

  await logToJob(jobId, `Generating script for: "${topic.title}" [${topic.category}]`);

  const language = await getSetting('DEFAULT_LANGUAGE');
  const contentStyle = await getSetting('CONTENT_STYLE');
  const scriptStyle = getScriptStyle(topic.category);

  const systemPrompt = `You are an expert scriptwriter for viral short-form vertical videos (YouTube Shorts / Instagram Reels / TikTok).

Content Category: ${topic.category}
Script Style Guide: 
${scriptStyle}

General Rules:
- Language: ${language} (mix of Hindi and English where natural, or pure English if that fits better)
- Target duration: 45-75 seconds of spoken narration (approx 100-160 words)
- Pace: ${contentStyle === 'FAST_PACED' ? 'Very fast. Short sentences. One idea per sentence.' : 'Natural, clear pacing'}
- Narration must be the EXACT words for the TTS engine to speak
- SCRIPT & VISUAL COHERENCE (CRITICAL):
  * The video is rendered scene-by-scene directly from your 'scenes' array.
  * Every scene has an exact chunk of narration and a matching visual prompt.
  * The full 'narration' field must be the EXACT joined text of all 'scenes[].narration'.
  * The 'visualPrompt' for each scene must directly represent what is being narrated in that specific scene.
  * For science, history, psychology, facts, and mysteries, set 'visualType' to 'image' and use specific image search terms (e.g. species names, historical figures, locations, medical scans).
- Claims must be labeled: confirmed / theory / alleged / opinion
- Only output JSON matching the schema.`;

  const researchData = JSON.parse(topic.research.findings || '{}');
  const userPrompt = `Topic: ${topic.title}
Category: ${topic.category}
Hook: ${topic.hook}

Research Findings:
${researchData.findings || topic.research.findings}

Sources available:
${(researchData.sources || []).join('\n')}

Write a complete, viral-ready script.`;

  const response = await generateStructuredLLM(systemPrompt, userPrompt, ScriptSchema, 'script');

  // Enforce 100% synchronization: narration is the exact join of all scene narrations
  const sceneNarration = (response.scenes || [])
    .map(s => s.narration.trim())
    .filter(Boolean)
    .join(' ');
  const finalNarration = sceneNarration.length > 0 ? sceneNarration : response.narration;
  const finalWordCount = finalNarration.split(/\s+/).filter(Boolean).length;

  await logToJob(jobId, `Script generated. Word count: ${finalWordCount}. Scenes: ${response.scenes.length}`);

  // Check if script already exists (idempotency)
  const existing = await prisma.script.findUnique({ where: { topicId } });
  if (existing) {
    await prisma.script.update({
      where: { topicId },
      data: {
        title: response.title,
        hook: response.hook,
        narration: finalNarration,
        scenes: JSON.stringify(response.scenes),
        cta: response.cta,
        description: response.description,
        hashtags: JSON.stringify(response.hashtags),
        language,
        wordCount: finalWordCount,
        claims: JSON.stringify(response.claims),
        status: 'DRAFT'
      }
    });
    await enqueueJob('FACT_CHECK', { scriptId: existing.id });
    await logToJob(jobId, `Updated existing script. Enqueued FACT_CHECK.`);
    return;
  }

  const script = await prisma.script.create({
    data: {
      topicId,
      title: response.title,
      hook: response.hook,
      narration: finalNarration,
      scenes: JSON.stringify(response.scenes),
      cta: response.cta,
      description: response.description,
      hashtags: JSON.stringify(response.hashtags),
      language,
      wordCount: finalWordCount,
      claims: JSON.stringify(response.claims),
      status: 'DRAFT'
    }
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { status: 'SCRIPTED' }
  });

  await enqueueJob('FACT_CHECK', { scriptId: script.id });
  await logToJob(jobId, `Enqueued FACT_CHECK.`);
}
