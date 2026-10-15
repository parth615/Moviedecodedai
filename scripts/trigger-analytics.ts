import { prisma } from '../src/lib/prisma';
import { enqueueJob } from '../src/lib/queue';

async function main() {
  const pub = await prisma.publication.findFirst({
    where: { status: 'PUBLISHED' }
  });

  if (!pub) {
    console.log("No published video found yet. Wait for PUBLISH_VIDEO to finish.");
    return;
  }

  console.log(`Enqueuing FETCH_ANALYTICS for publication ${pub.id}...`);
  await enqueueJob('FETCH_ANALYTICS', { publicationId: pub.id });
  console.log("Queued!");
}

main().catch(console.error);
