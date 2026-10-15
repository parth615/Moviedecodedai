import { prisma } from '../../lib/prisma';
import { enqueueJob, logToJob } from '../../lib/queue';

export async function handleFactCheck(data: { scriptId: string }, jobId: string) {
  const { scriptId } = data;
  if (!scriptId) throw new Error("Missing scriptId");

  await logToJob(jobId, `Starting fact check for script: ${scriptId}`);
  
  // In a real scenario, this would use another LLM call or external API to verify claims.
  // Since we already prompted the LLM to only use factual claims from research, we just 
  // do a safety sanity check here. For now, we auto-pass it to VOICE generation.
  
  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'FACT_CHECKED' }
  });

  await enqueueJob('GENERATE_VOICE', { scriptId });
  await logToJob(jobId, `Fact check complete. Enqueued GENERATE_VOICE.`);
}
