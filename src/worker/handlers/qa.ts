import { prisma } from '../../lib/prisma';
import { enqueueJob, logToJob } from '../../lib/queue';
import { getSetting } from '../../lib/settings';

export async function handleRunQA(data: { videoId: string }, jobId: string) {
  const { videoId } = data;
  if (!videoId) throw new Error("Missing videoId");

  const video = await prisma.video.findUnique({ 
    where: { id: videoId },
    include: { 
      script: {
        include: { topic: true, visualAssets: true, voiceAsset: true, gameplayAsset: true }
      } 
    }
  });

  if (!video) throw new Error(`Video ${videoId} not found`);

  await logToJob(jobId, `Starting automated QA for video: ${video.id}`);
  
  let qaScore = 100;
  let copyrightRisk = 'LOW';
  
  // Rule 1: Duration check (YouTube Shorts maximum cutoff is 60 seconds)
  if (video.duration > 60) {
    const over = video.duration - 60;
    const penalty = Math.min(20, 5 + over * 2);
    qaScore -= penalty;
    await logToJob(jobId, `-${penalty} points: Video exceeds 60s Shorts duration limit (${video.duration}s)`);
  } else if (video.duration < 15) {
    qaScore -= 10;
    await logToJob(jobId, `-10 points: Video is under 15 seconds (${video.duration}s)`);
  }

  // Rule 2: 9:16 Vertical Aspect Ratio (Supports standard vertical 720x1280 HD & 1080x1920 FHD)
  const isVertical916 = video.resolution === '720x1280' || video.resolution === '1080x1920';
  if (!isVertical916) {
    qaScore -= 35;
    await logToJob(jobId, `-35 points: Resolution ${video.resolution} is not vertical 9:16 (expected 720x1280 or 1080x1920)`);
  }

  // Rule 3: Visual coverage (Images generated for all script scenes)
  const scenes = JSON.parse(video.script.scenes || '[]');
  const visualCount = video.script.visualAssets.length;
  if (scenes.length > 0 && visualCount < scenes.length) {
    const missing = scenes.length - visualCount;
    const penalty = Math.min(25, missing * 5);
    qaScore -= penalty;
    await logToJob(jobId, `-${penalty} points: Missing visual assets for ${missing} of ${scenes.length} scene(s).`);
  }

  // Rule 4: Voice & Subtitles check
  if (!video.script.voiceAsset) {
    qaScore -= 20;
    await logToJob(jobId, `-20 points: Missing audio narration track.`);
  } else if (!video.script.voiceAsset.subtitles) {
    qaScore -= 10;
    await logToJob(jobId, `-10 points: Missing subtitle timing data.`);
  }

  // Rule 5: Gameplay Asset check for SplitScreenTemplate
  if (video.script.templateId === 'SplitScreenTemplate' && !video.script.gameplayAsset) {
    qaScore -= 15;
    await logToJob(jobId, `-15 points: Missing Gameplay Asset for SplitScreenTemplate.`);
  }

  // Ensure score is cleanly bounded between 0 and 100
  qaScore = Math.max(0, Math.min(100, Math.round(qaScore)));

  // Cost tracking (simulated estimate)
  const estimatedCost = (video.script.wordCount || 0) * 0.001;

  await prisma.video.update({
    where: { id: videoId },
    data: { 
      qaScore,
      status: 'READY_FOR_APPROVAL'
    }
  });

  // Create or refresh approval record
  await prisma.approval.upsert({
    where: { videoId: video.id },
    update: { status: 'PENDING' },
    create: {
      videoId: video.id,
      status: 'PENDING',
    }
  });

  await prisma.script.update({
    where: { id: video.scriptId },
    data: { status: 'READY_FOR_APPROVAL' }
  });

  const minQaScore = parseInt(await getSetting('MINIMUM_QA_SCORE'), 10) || 75;

  if (qaScore < minQaScore) {
    await logToJob(jobId, `QA Score ${qaScore} failed to meet threshold ${minQaScore}.`);
  } else {
    await logToJob(jobId, `QA Passed (${qaScore}/100). Ready for Approval.`);
  }

  // Alert via Telegram
  await enqueueJob('NOTIFY_TELEGRAM', { videoId: video.id, copyrightRisk });
  await logToJob(jobId, `Enqueued NOTIFY_TELEGRAM.`);
}
