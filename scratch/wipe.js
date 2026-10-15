const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.video.deleteMany({});
  await prisma.visualAsset.deleteMany({});
  await prisma.voiceAsset.deleteMany({});
  await prisma.script.deleteMany({});
  await prisma.research.deleteMany({});
  await prisma.job.deleteMany({});
  
  const topic = await prisma.topic.findFirst();
  if (topic) {
    await prisma.job.create({
      data: { name: 'RESEARCH_TOPIC', data: JSON.stringify({ topicId: topic.id }) }
    });
    console.log("Wiped database and enqueued clean topic.");
  }
}

run().finally(() => prisma.$disconnect());
