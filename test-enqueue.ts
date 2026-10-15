import { prisma } from './src/lib/prisma';
import { enqueueJob } from './src/lib/queue';

async function test() {
  console.log("Enqueuing GENERATE_TOPICS job...");
  await enqueueJob('GENERATE_TOPICS', {});
  console.log("Job enqueued!");
}

test().catch(console.error);
