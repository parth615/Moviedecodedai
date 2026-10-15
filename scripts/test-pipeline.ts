import { enqueueJob } from '../src/lib/queue';

async function main() {
  console.log("Enqueueing GENERATE_TOPICS job...");
  await enqueueJob('GENERATE_TOPICS', {});
  console.log("Job enqueued successfully.");
}

main().catch(console.error);
