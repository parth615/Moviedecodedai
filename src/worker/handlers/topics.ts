import { prisma } from '../../lib/prisma';
import { generateStructuredLLM } from '../../lib/providers/llm';
import { z } from 'zod';
import { enqueueJob, logToJob } from '../../lib/queue';
import { checkTopicSimilarity } from '../../lib/similarity';
import { getSetting } from '../../lib/settings';

// ─── Universal categories — Crazy Fun Facts Focus ──────────────────────────────
export const CONTENT_CATEGORIES = [
  'Crazy Historical Facts',
  'Bizarre Science',
  'Weird Animal Behaviors',
  'Unbelievable True Stories',
  'Mind-Blowing Space Facts',
  'Disturbing Psychology',
  'Cognitive Biases',
  'Crazy Coincidences',
  'Bizarre Inventions',
  'Deep Ocean Mysteries',
  'Creepy Unsolved Mysteries',
  'Extreme Weather Phenomena',
  'Internet Urban Legends',
  'Human Body Oddities'
];

// Content mix for diversity enforcement
const CONTENT_MIX = [
  { categories: ['Crazy Historical Facts', 'Bizarre Science', 'Weird Animal Behaviors', 'Human Body Oddities'], weight: 3, label: 'core_facts' },
  { categories: ['Mind-Blowing Space Facts', 'Extreme Weather Phenomena', 'Deep Ocean Mysteries'], weight: 2, label: 'nature_space' },
  { categories: ['Disturbing Psychology', 'Cognitive Biases', 'Crazy Coincidences'], weight: 2, label: 'psychology' },
  { categories: ['Unbelievable True Stories', 'Creepy Unsolved Mysteries', 'Internet Urban Legends', 'Bizarre Inventions'], weight: 3, label: 'stories' }
];

const TopicsSchema = z.object({
  topics: z.array(z.object({
    title: z.string(),
    category: z.string(),
    hook: z.string(),
    description: z.string(),
    viralityScore: z.number().min(0).max(100),
    difficultyScore: z.number().min(0).max(100)
  }))
});

export async function handleGenerateTopics(data: any, jobId: string) {
  await logToJob(jobId, 'Starting Universal Idea Engine...');

  const language = await getSetting('DEFAULT_LANGUAGE');
  const country = await getSetting('DEFAULT_COUNTRY');
  const rawLimit = parseInt(await getSetting('DAILY_VIDEO_LIMIT')) || 50;
  const limit = Math.max(rawLimit, 50);

  // Determine how many topics to generate in this run (default 1 on-demand for lightning fast render)
  const countToGenerate = Math.max(1, Math.min(data.count || 1, 5));

  // Check how many topics already created today by this user
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = await prisma.topic.count({
    where: { userId: data.userId || null, createdAt: { gte: todayStart } }
  });

  if (todayCount >= limit && !data.userId) {
    await logToJob(jobId, `Daily limit of ${limit} topics already reached (${todayCount} created today). Skipping.`);
    return;
  }

  await logToJob(jobId, `Generating ${countToGenerate} topic(s) on-demand (${todayCount}/${limit} used today).`);

  // Build a diverse category list based on mix weights
  const requestedCategories: string[] = [];
  for (const group of CONTENT_MIX) {
    const shuffled = [...group.categories].sort(() => Math.random() - 0.5);
    requestedCategories.push(...shuffled);
  }
  const shuffledAll = requestedCategories.sort(() => Math.random() - 0.5);
  const finalCategories = shuffledAll.slice(0, countToGenerate);

  await logToJob(jobId, `Category mix requested: ${finalCategories.join(', ')}`);

  const systemPrompt = `You are a viral content strategist for a short-form video channel targeting ${country === 'IN' ? 'Indian' : 'global'} audiences on YouTube Shorts, Instagram Reels, and TikTok.

Generate engaging, highly viral topic ideas focused exclusively on CRAZY FUN FACTS, mysterious historical events, bizarre science, and unbelievable true stories. Do NOT generate topics about movies, Hollywood, or Bollywood.

Target audience: 18-35 year olds who speak ${language}.
Default country context: ${country === 'IN' ? 'India (include Indian context where naturally relevant — ancient Indian history, bizarre local phenomena, ISRO, crazy true crime, etc.)' : 'Global'}

Rules:
- Hook must be a single shocking/curious sentence that makes someone stop scrolling
- Topics must be specific, not generic (NOT "psychology facts" — YES "why your brain becomes addicted to revenge")
- viralityScore: how likely to go viral (0-100)
- difficultyScore: how hard to research/script (0-100)
- Only output JSON matching the schema.`;

  const userPrompt = `Generate ${countToGenerate} viral short-form video topic(s) covering these categories: ${finalCategories.join(', ')}.

Each topic must be genuinely interesting, captivating, and high-retention. No duplicates, no generic ideas.`;

  const response = await generateStructuredLLM(systemPrompt, userPrompt, TopicsSchema, 'topics');

  await logToJob(jobId, `LLM returned ${response.topics.length} topics. Checking for duplicates...`);

  let created = 0;
  for (const t of response.topics) {
    const { isTooSimilar, maxScore } = await checkTopicSimilarity(t.title, t.hook, data.userId || null);
    if (isTooSimilar) {
      await logToJob(jobId, `Skipped "${t.title}" — too similar to existing topic (${maxScore}% match).`);
      continue;
    }

    const topic = await prisma.topic.create({
      data: {
        userId: data.userId || null,
        title: t.title,
        category: t.category,
        hook: t.hook,
        description: t.description,
        viralityScore: t.viralityScore,
        difficultyScore: t.difficultyScore,
        status: 'PENDING',
        language
      }
    });

    await enqueueJob('RESEARCH_TOPIC', { topicId: topic.id });
    await logToJob(jobId, `✓ Created topic: "${t.title}" [${t.category}] (similarity: ${maxScore}%)`);
    created++;
  }

  await logToJob(jobId, `Done. Created ${created} new topics and enqueued research jobs.`);
}
