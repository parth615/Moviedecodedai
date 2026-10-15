const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.setting.update({
    where: { key: 'PROVIDER_MODE' },
    data: { value: 'mock' }
  });
  
  await prisma.job.deleteMany({});
  
  const topic = await prisma.topic.findFirst();
  if (topic) {
    await prisma.job.create({
      data: { name: 'RESEARCH_TOPIC', data: JSON.stringify({ topicId: topic.id }) }
    });
    console.log("Forced mock mode, cleared queue, and enqueued topic.");
  }
}

run().finally(() => prisma.$disconnect());
