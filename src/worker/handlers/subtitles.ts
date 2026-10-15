import { prisma } from '../../lib/prisma';
import { enqueueJob, logToJob } from '../../lib/queue';

export async function handleGenerateSubtitles(data: { scriptId: string }, jobId: string) {
  const { scriptId } = data;
  if (!scriptId) throw new Error("Missing scriptId");

  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script || !script.narration) throw new Error(`Script ${scriptId} not found or missing narration`);

  const voiceAsset = await prisma.voiceAsset.findUnique({ where: { scriptId } });
  if (!voiceAsset) throw new Error(`VoiceAsset for script ${scriptId} not found`);

  await logToJob(jobId, `Starting Subtitle Generation for script: ${script.title}`);
  
  // MOCK Subtitle Generation
  // In a real application, you would query an API like Deepgram or OpenAI Whisper
  // to get exact word-level timestamps. For this mock, we will evenly distribute
  // the known duration across all words in the narration.
  
  const words = script.narration.split(/\s+/).filter(w => w.length > 0);
  const totalDuration = voiceAsset.duration; // in seconds
  const durationPerWord = totalDuration / words.length;

  const subtitles = words.map((word, index) => {
    return {
      word,
      start: Number((index * durationPerWord).toFixed(2)),
      end: Number(((index + 1) * durationPerWord).toFixed(2))
    };
  });

  await prisma.voiceAsset.update({
    where: { scriptId },
    data: { subtitles: JSON.stringify(subtitles) }
  });

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'SUBTITLES_GENERATED' }
  });

  await enqueueJob('GENERATE_VISUALS', { scriptId });
  await logToJob(jobId, `Generated ${subtitles.length} subtitle words. Enqueued GENERATE_VISUALS.`);
}
