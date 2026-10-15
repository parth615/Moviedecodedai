const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const voice = await prisma.voiceAsset.findFirst({orderBy: {id: 'desc'}});
  console.log(voice);
  
  const video = await prisma.video.findFirst({
    orderBy: {createdAt: 'desc'},
    include: {
      script: {
        include: { voiceAsset: true, visualAssets: true }
      }
    }
  });
  console.log(JSON.stringify(video, null, 2));
}

run().finally(() => prisma.$disconnect());
