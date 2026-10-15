import { prisma } from '../src/lib/prisma';
import { enqueueJob } from '../src/lib/queue';

async function main() {
  const video = await prisma.video.findFirst({
    where: { status: 'READY_FOR_APPROVAL' }
  });

  if (!video) {
    console.log("No video ready for approval.");
    return;
  }

  console.log(`Approving video ${video.id}...`);

  await prisma.approval.upsert({
    where: { videoId: video.id },
    update: { status: 'APPROVED', reviewer: 'E2E_Test' },
    create: { videoId: video.id, status: 'APPROVED', reviewer: 'E2E_Test' }
  });

  await prisma.video.update({
    where: { id: video.id },
    data: { status: 'APPROVED' }
  });

  console.log(`Enqueuing PUBLISH_VIDEO...`);
  await enqueueJob('PUBLISH_VIDEO', { videoId: video.id });
  
  console.log("Approved and queued for publishing!");
}

main().catch(console.error);
