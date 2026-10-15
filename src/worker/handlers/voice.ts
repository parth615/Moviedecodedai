import { prisma } from '../../lib/prisma';
import { enqueueJob, logToJob } from '../../lib/queue';
import { getTTSProvider } from '../../lib/providers/tts';
import { getSetting } from '../../lib/settings';

export async function handleGenerateVoice(data: { scriptId: string }, jobId: string) {
  const { scriptId } = data;
  if (!scriptId) throw new Error("Missing scriptId");

  const script = await prisma.script.findUnique({ where: { id: scriptId } });
  if (!script || !script.narration) throw new Error(`Script ${scriptId} not found or missing narration`);

  await logToJob(jobId, `Starting Voice Generation for script: ${script.title}`);
  
  const provider = await getTTSProvider();
  const defaultVoice = await getSetting('DEFAULT_VOICE');

  const { audioUrl, duration, cost } = await provider.generateSpeech(script.narration, defaultVoice);

  await prisma.voiceAsset.upsert({
    where: { scriptId },
    update: {
      audioUrl,
      duration: Math.round(duration),
      provider: (await getSetting('PROVIDER_MODE')) === 'mock' ? 'Mock TTS' : 'ElevenLabs',
    },
    create: {
      scriptId,
      audioUrl,
      duration: Math.round(duration),
      provider: (await getSetting('PROVIDER_MODE')) === 'mock' ? 'Mock TTS' : 'ElevenLabs',
    }
  });

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'VOICE_GENERATED' }
  });

  await enqueueJob('GENERATE_SUBTITLES', { scriptId });
  await logToJob(jobId, `Voice generation complete. Audio duration: ${duration}s. Enqueued GENERATE_SUBTITLES.`);
}
