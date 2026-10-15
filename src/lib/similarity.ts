import { prisma } from './prisma';

// A simple lexical overlap coefficient for similarity.
// In true production, replace this with vector embeddings (e.g., text-embedding-3-small).
function calculateSimilarity(text1: string, text2: string): number {
  const t1 = text1.toLowerCase().split(/\W+/).filter(Boolean);
  const t2 = text2.toLowerCase().split(/\W+/).filter(Boolean);
  
  if (t1.length === 0 || t2.length === 0) return 0;
  
  const set1 = new Set(t1);
  const set2 = new Set(t2);
  let intersection = 0;
  
  for (const word of set1) {
    if (set2.has(word)) intersection++;
  }
  
  return (intersection * 2) / (set1.size + set2.size); // Dice coefficient
}

export async function checkTopicSimilarity(
  newTitle: string, 
  newHook: string,
  userId?: string | null
): Promise<{ isTooSimilar: boolean, maxScore: number }> {
  const whereClause: any = {};
  if (userId) {
    whereClause.userId = userId;
  }

  const existingTopics = await prisma.topic.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  let maxScore = 0;
  for (const t of existingTopics) {
    const scoreTitle = calculateSimilarity(newTitle, t.title);
    const scoreHook = t.hook ? calculateSimilarity(newHook, t.hook) : 0;
    
    // Weighted average
    const totalScore = (scoreTitle * 0.6) + (scoreHook * 0.4);
    if (totalScore > maxScore) maxScore = totalScore;
  }

  // Threshold > 0.8 means they share too many exact words
  return {
    isTooSimilar: maxScore > 0.8,
    maxScore: Math.round(maxScore * 100)
  };
}
