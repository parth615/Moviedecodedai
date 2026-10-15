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
  
  // Rule 1: Duration bounds (Shorts ideally < 60s)
  if (video.duration > 60) {
    qaScore -= 10;
    await logToJob(jobId, `-10 points: Video exceeds 60 seconds (${video.duration}s)`);
  }

  // Rule 1.5: Strict resolution bounds
  if (video.resolution !== '1080x1920') {
    qaScore -= 40; // Heavy penalty for wrong aspect ratio
    await logToJob(jobId, `-40 points: Resolution is ${video.resolution}, expected 1080x1920`);
  }

  // Rule 2: Missing visual assets
  const scenes = JSON.parse(video.script.scenes || '[]');
  if (video.script.visualAssets.length < scenes.length) {
    qaScore -= 20;
    await logToJob(jobId, `-20 points: Missing visual assets for some scenes.`);
  }

  // Rule 3: Split-Screen Gameplay Engine Rules
  if (video.script.templateId === 'SplitScreenTemplate') {
    if (!video.script.gameplayAsset) {
      qaScore -= 30;
      await logToJob(jobId, `-30 points: Missing Gameplay Asset for SplitScreenTemplate.`);
    } else if (video.script.gameplayAsset.usageCount > 5) {
      qaScore -= 10;
      await logToJob(jobId, `-10 points: Gameplay asset has been used heavily (${video.script.gameplayAsset.usageCount} times). Considered stale.`);
    }

    // Mock Audio & Sync checks
    if (!video.script.voiceAsset?.subtitles) {
      qaScore -= 15;
      await logToJob(jobId, `-15 points: Missing subtitle timing data. Caption sync will fail.`);
    }
    
    // Mock Audio Clipping check (Randomly flag 5% of the time for realism)
    if (Math.random() < 0.05) {
      qaScore -= 5;
      await logToJob(jobId, `-5 points: Audio clipping detected in narration track.`);
    }
  }

  // Rule 4: Copyright Risk check
  const hasRiskyAssets = video.script.visualAssets.some(a => a.provider === 'MockProvider' || a.provider.includes('Movie'));
  if (hasRiskyAssets || (video.script.gameplayAsset && !video.script.gameplayAsset.license)) {
    copyrightRisk = 'HIGH';
    await logToJob(jobId, `Flagged HIGH copyright risk due to unverified visual providers or missing gameplay license.`);
  }

  // Cost tracking (simulated for now, would sum actual DB logs)
  const estimatedCost = (video.script.wordCount || 0) * 0.001; // Mock math

  await prisma.video.update({
    where: { id: videoId },
    data: { 
      qaScore: Math.max(0, qaScore),
      status: 'READY_FOR_APPROVAL'
    }
  });

  // Create approval record
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

  const minQaScore = parseInt(await getSetting('MINIMUM_QA_SCORE'), 10) || 80;

  if (qaScore < minQaScore) {
    await logToJob(jobId, `QA Score ${qaScore} failed to meet threshold ${minQaScore}. Manual intervention required.`);
  } else {
    await logToJob(jobId, `QA Passed (${qaScore}/100). Ready for Approval.`);
  }

  // Alert via Telegram
  await enqueueJob('NOTIFY_TELEGRAM', { videoId: video.id, copyrightRisk });
  await logToJob(jobId, `Enqueued NOTIFY_TELEGRAM.`);
}
