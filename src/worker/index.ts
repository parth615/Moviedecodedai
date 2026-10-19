import fs from 'fs';
import path from 'path';

// Load .env automatically if running standalone
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq > 0) {
      const k = trimmed.slice(0, eq).trim();
      let v = trimmed.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v && !process.env[k]) {
        process.env[k] = v;
      }
    }
  }
}

import { getNextJob, markJobCompleted, markJobFailed, logToJob, enqueueJob } from '../lib/queue';
import { getSetting } from '../lib/settings';
import { prisma } from '../lib/prisma';

import { handleGenerateTopics } from './handlers/topics';
import { handleResearchTopic } from './handlers/research';
import { handleGenerateScript } from './handlers/script';
import { handleFactCheck } from './handlers/factCheck';
import { handleGenerateVoice } from './handlers/voice';
import { handleGenerateSubtitles } from './handlers/subtitles';
import { handleGenerateVisuals } from './handlers/visuals';
import { handleRenderVideo } from './handlers/render';
import { handleRunQA } from './handlers/qa';
import { handleNotifyTelegram } from './handlers/telegram';
import { handlePublishVideo } from './handlers/publish';
import { handleFetchAnalytics } from './handlers/analytics';

const MAX_ATTEMPTS = 3;

const handlers: Record<string, (data: any, jobId: string) => Promise<void>> = {
  GENERATE_TOPICS: handleGenerateTopics,
  RESEARCH_TOPIC: handleResearchTopic,
  GENERATE_SCRIPT: handleGenerateScript,
  FACT_CHECK: handleFactCheck,
  GENERATE_VOICE: handleGenerateVoice,
  GENERATE_SUBTITLES: handleGenerateSubtitles,
  GENERATE_VISUALS: handleGenerateVisuals,
  RENDER_VIDEO: handleRenderVideo,
  RUN_QA: handleRunQA,
  NOTIFY_TELEGRAM: handleNotifyTelegram,
  PUBLISH_VIDEO: handlePublishVideo,
  FETCH_ANALYTICS: handleFetchAnalytics
};

async function processNextJob() {
  const isPaused = await getSetting('AUTOMATION_PAUSED');
  if (isPaused === 'true') return;

  const job = await getNextJob();
  if (!job) return;

  console.log(`[WORKER] Picked up job: ${job.name} (ID: ${job.id}, attempt: ${job.attemptCount})`);
  await logToJob(job.id, `Started processing attempt ${job.attemptCount}`);

  try {
    const handler = handlers[job.name];
    if (!handler) throw new Error(`No handler found for job type: ${job.name}`);

    const payload = job.data ? JSON.parse(job.data) : {};
    await handler(payload, job.id);

    await markJobCompleted(job.id);
    console.log(`[WORKER] ✓ Completed job: ${job.name} (ID: ${job.id})`);
  } catch (error: any) {
    console.error(`[WORKER] ✗ Job failed: ${job.name} (ID: ${job.id})`, error.message);

    const isNonRetryable = error.message?.includes('uploadLimitExceeded') || 
                           error.message?.includes('exceeded the number of videos') ||
                           error.message?.includes('No YouTube account connected');

    if (job.attemptCount < MAX_ATTEMPTS && !isNonRetryable) {
      // Retry: re-queue with backoff
      const backoffMs = job.attemptCount * 5000;
      await logToJob(job.id, `Failed (attempt ${job.attemptCount}/${MAX_ATTEMPTS}). Will retry in ${backoffMs / 1000}s: ${error.message}`);
      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: 'PENDING',
          attemptCount: job.attemptCount + 1,
          updatedAt: new Date(Date.now() + backoffMs)
        }
      });
    } else {
      // Max attempts reached or non-retryable — mark permanently failed
      await logToJob(job.id, `Permanently FAILED: ${error.message}`);
      await markJobFailed(job.id, error);

      // If publish failed, return video to READY_FOR_APPROVAL and record error in approval.feedback
      if (job.name === 'PUBLISH_VIDEO') {
        const payload = job.data ? JSON.parse(job.data) : {};
        if (payload.videoId) {
          await prisma.video.update({
            where: { id: payload.videoId },
            data: { status: 'READY_FOR_APPROVAL' }
          });
          await prisma.approval.upsert({
            where: { videoId: payload.videoId },
            update: {
              status: 'PENDING',
              feedback: error.message
            },
            create: {
              videoId: payload.videoId,
              status: 'PENDING',
              feedback: error.message
            }
          });
        }
      }
    }
  }
}

async function runScheduler() {
  const isPaused = await getSetting('AUTOMATION_PAUSED');
  if (isPaused === 'true') return;

  const scheduleStr = await getSetting('POSTING_SCHEDULE');
  const times = scheduleStr.split(',').map((t: string) => t.trim());

  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const currentTime = formatter.format(now);

  if (times.includes(currentTime)) {
    const recentlyScheduled = await prisma.job.findFirst({
      where: { name: 'PUBLISH_VIDEO', createdAt: { gte: new Date(Date.now() - 60000) } }
    });
    if (recentlyScheduled) return;

    const approvedVideo = await prisma.video.findFirst({
      where: { status: 'APPROVED' },
      orderBy: { updatedAt: 'asc' }
    });

    if (approvedVideo) {
      console.log(`[SCHEDULER] Publishing video ${approvedVideo.id} at scheduled time ${currentTime}`);
      await enqueueJob('PUBLISH_VIDEO', { videoId: approvedVideo.id });
    }
  }
}

async function startWorker() {
  console.log('[WORKER] Starting universal content engine worker...');

  // Reset any stuck PROCESSING jobs from previous crashes
  const stuckJobs = await prisma.job.updateMany({
    where: { status: 'PROCESSING' },
    data: { status: 'PENDING' }
  });
  if (stuckJobs.count > 0) {
    console.log(`[WORKER] Reset ${stuckJobs.count} stuck PROCESSING jobs back to PENDING.`);
  }

  while (true) {
    try {
      await processNextJob();
      await runScheduler();
    } catch (err: any) {
      console.error('[WORKER] Unexpected worker loop error:', err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

startWorker().catch(console.error);
