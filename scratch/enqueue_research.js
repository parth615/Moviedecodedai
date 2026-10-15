const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const topic = await prisma.topic.create({
    data: {
      title: "The Matrix: Neo's Secret " + Date.now(),
      category: "Movie theories",
      hook: "What if everything you knew was wrong?",
      description: "A deep dive into the theory.",
      viralityScore: 99,
      difficultyScore: 50,
      status: 'PENDING'
    }
  });
  
  await prisma.job.create({
    data: {
      name: 'RESEARCH_TOPIC',
      data: JSON.stringify({ topicId: topic.id })
    }
  });
  console.log('Enqueued RESEARCH_TOPIC for topic:', topic.id);
}

run().finally(() => prisma.$disconnect());
