import { prisma } from './prisma';

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
  'from', 'about', 'as', 'into', 'like', 'through', 'after', 'over', 'between', 'out',
  'against', 'during', 'without', 'before', 'under', 'around', 'among', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'who', 'whom', 'whose', 'which', 'what', 'where', 'when', 'why', 'how', 'this',
  'that', 'these', 'those', 'it', 'its', 'you', 'your', 'man', 'case', 'story'
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function calculateSimilarity(text1: string, text2: string): number {
  const k1 = extractKeywords(text1);
  const k2 = extractKeywords(text2);

  if (k1.length === 0 || k2.length === 0) return 0;

  const set1 = new Set(k1);
  const set2 = new Set(k2);
  let intersection = 0;

  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }

  // Dice coefficient on meaningful keywords
  return (intersection * 2) / (set1.size + set2.size);
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => !STOP_WORDS.has(w))
    .sort()
    .join(' ');
}

export async function checkTopicSimilarity(
  newTitle: string, 
  newHook: string,
  userId?: string | null
): Promise<{ isTooSimilar: boolean, maxScore: number, matchedTitle?: string }> {
  // Query up to 250 recent topics across both current user and global topics
  const existingTopics = await prisma.topic.findMany({
    where: userId ? { OR: [{ userId }, { userId: null }] } : {},
    select: { title: true, hook: true },
    orderBy: { createdAt: 'desc' },
    take: 250
  });

  const normNew = normalizeTitle(newTitle);
  let maxScore = 0;
  let matchedTitle: string | undefined = undefined;

  for (const t of existingTopics) {
    // 1. Exact normalized title match
    const normExisting = normalizeTitle(t.title);
    if (normNew.length > 0 && normNew === normExisting) {
      return { isTooSimilar: true, maxScore: 100, matchedTitle: t.title };
    }

    // 2. Keyword similarity on titles
    const scoreTitle = calculateSimilarity(newTitle, t.title);

    // 3. Keyword similarity on hooks
    const scoreHook = t.hook ? calculateSimilarity(newHook, t.hook) : 0;

    // Direct title threshold: if titles share >=45% keywords, it's the same topic
    if (scoreTitle >= 0.45) {
      const pct = Math.round(scoreTitle * 100);
      if (pct > maxScore) {
        maxScore = pct;
        matchedTitle = t.title;
      }
    }

    // Weighted combined score
    const combined = (scoreTitle * 0.7) + (scoreHook * 0.3);
    const combinedPct = Math.round(combined * 100);
    if (combinedPct > maxScore) {
      maxScore = combinedPct;
      matchedTitle = t.title;
    }
  }

  // Strict threshold: >= 45% means duplicate or near-duplicate idea
  const isTooSimilar = maxScore >= 45;

  return {
    isTooSimilar,
    maxScore,
    matchedTitle
  };
}
