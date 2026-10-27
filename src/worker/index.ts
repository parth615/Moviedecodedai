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

          // Safely pause Auto-Pilot if publishing failed
          try {
            const apStatus = await getSetting('AUTOPILOT_STATUS');
            if (apStatus === 'active') {
              await prisma.setting.upsert({
                where: { key: 'AUTOPILOT_STATUS' },
                update: { value: 'paused' },
                create: { key: 'AUTOPILOT_STATUS', value: 'paused' }
              });
              await logToJob(job.id, `[AUTOPILOT] Paused Auto-Pilot sequence due to publishing error: ${error.message}`);
            }
          } catch (_) {}
        }
      }
    }
  }
}

async function executeScheduledSlot(slotTime: string, slotKey: string) {
  try {
    // Priority 1: Check for an already approved video created in the last 24 hours
    const approvedVideo = await prisma.video.findFirst({
      where: {
        status: 'APPROVED',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { updatedAt: 'asc' }
    });

    if (approvedVideo) {
      console.log(`[SCHEDULER] Publishing fresh approved video ${approvedVideo.id} at scheduled slot ${slotTime} IST...`);
      await enqueueJob('PUBLISH_VIDEO', { videoId: approvedVideo.id });
      await prisma.setting.upsert({
        where: { key: `SCHEDULE_SLOT_RUN_${slotKey}` },
        update: { value: 'completed' },
        create: { key: `SCHEDULE_SLOT_RUN_${slotKey}`, value: 'completed' }
      });
      return;
    }

    // Priority 2: Check for a video waiting for approval created in the last 24 hours
    const readyVideo = await prisma.video.findFirst({
      where: {
        status: 'READY_FOR_APPROVAL',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      orderBy: { updatedAt: 'asc' }
    });

    if (readyVideo) {
      console.log(`[SCHEDULER] Fresh video ${readyVideo.id} is ready for approval. Auto-approving & publishing for slot ${slotTime} IST...`);
      await prisma.approval.upsert({
        where: { videoId: readyVideo.id },
        update: { status: 'APPROVED', reviewer: 'Scheduler', approvedAt: new Date() },
        create: { videoId: readyVideo.id, status: 'APPROVED', reviewer: 'Scheduler', approvedAt: new Date() }
      });
      await prisma.video.update({
        where: { id: readyVideo.id },
        data: { status: 'APPROVED' }
      });
      await prisma.script.update({
        where: { id: readyVideo.scriptId },
        data: { status: 'READY_FOR_PUBLISHING' }
      });
      await enqueueJob('PUBLISH_VIDEO', { videoId: readyVideo.id });
      await prisma.setting.upsert({
        where: { key: `SCHEDULE_SLOT_RUN_${slotKey}` },
        update: { value: 'completed' },
        create: { key: `SCHEDULE_SLOT_RUN_${slotKey}`, value: 'completed' }
      });
      return;
    }

    // Priority 3: Check if a video generation pipeline is already in progress
    const activePipelineJob = await prisma.job.findFirst({
      where: {
        name: { in: ['GENERATE_TOPICS', 'RESEARCH_TOPIC', 'GENERATE_SCRIPT', 'GENERATE_VOICE', 'GENERATE_VISUALS', 'RENDER_VIDEO', 'RUN_QA', 'PUBLISH_VIDEO'] },
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (activePipelineJob) {
      console.log(`[SCHEDULER] A video pipeline is already active (${activePipelineJob.name}). Marking slot ${slotTime} as assigned; it will auto-publish upon QA pass.`);
      await prisma.setting.upsert({
        where: { key: `SCHEDULE_SLOT_RUN_${slotKey}` },
        update: { value: 'completed' },
        create: { key: `SCHEDULE_SLOT_RUN_${slotKey}`, value: 'completed' }
      });
      return;
    }

    // Priority 4: Queue is empty -> Hands-free on-demand generation and auto-publish
    const autoGenSetting = await getSetting('SCHEDULE_AUTO_GENERATE');
    if (autoGenSetting === 'false') {
      console.log(`[SCHEDULER] Queue is empty and SCHEDULE_AUTO_GENERATE is disabled. Skipping slot.`);
      return;
    }

    // Find the user to debit credits and link YouTube credentials
    const autopilotUserId = await getSetting('AUTOPILOT_USER_ID');
    let user = autopilotUserId 
      ? await prisma.user.findUnique({ where: { id: autopilotUserId } })
      : null;

    if (!user || user.credits < 1) {
      const ytCred = await prisma.oAuthCredential.findFirst({
        where: { provider: 'youtube', userId: { not: null } },
        orderBy: { updatedAt: 'desc' }
      });
      if (ytCred?.userId) {
        user = await prisma.user.findUnique({ where: { id: ytCred.userId } });
      }
    }

    if (!user || user.credits < 1) {
      user = await prisma.user.findFirst({
        where: { credits: { gte: 1 } },
        orderBy: { updatedAt: 'desc' }
      });
    }

    if (!user || user.credits < 1) {
      console.warn(`[SCHEDULER] Scheduled slot ${slotTime} IST arrived, but no active user with credits found. Credits needed: 1.`);
      await prisma.setting.upsert({
        where: { key: `SCHEDULE_SLOT_RUN_${slotKey}` },
        update: { value: 'insufficient_credits' },
        create: { key: `SCHEDULE_SLOT_RUN_${slotKey}`, value: 'insufficient_credits' }
      });
      return;
    }

    // Deduct 1 credit & trigger full autonomous pipeline with AUTO_PUBLISH enabled
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1 } }
    });

    await prisma.setting.upsert({
      where: { key: 'AUTO_PUBLISH' },
      update: { value: 'true' },
      create: { key: 'AUTO_PUBLISH', value: 'true' }
    });

    await prisma.setting.upsert({
      where: { key: `SCHEDULE_SLOT_RUN_${slotKey}` },
      update: { value: 'completed' },
      create: { key: `SCHEDULE_SLOT_RUN_${slotKey}`, value: 'completed' }
    });

    console.log(`[SCHEDULER] 🚀 Hands-free scheduled generation triggered at ${slotTime} IST for ${user.name || user.email}! 1 credit used (${user.credits - 1} remaining). Full pipeline will craft and auto-publish short to YouTube.`);
    await enqueueJob('GENERATE_TOPICS', { userId: user.id, count: 1 });
  } catch (err: any) {
    console.error(`[SCHEDULER] Error executing slot ${slotTime}:`, err.message);
  }
}

async function runScheduler() {
  const [isPaused, scheduleMode] = await Promise.all([
    getSetting('AUTOMATION_PAUSED'),
    getSetting('SCHEDULE_MODE')
  ]);
  if (isPaused === 'true' || scheduleMode === 'paused') return;

  const scheduleStr = await getSetting('POSTING_SCHEDULE');
  const times = scheduleStr
    .split(',')
    .map((t: string) => t.trim())
    .filter(Boolean);

  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const currentTime = timeFormatter.format(now);

  const dateFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayDate = dateFormatter.format(now);

  const [currHour, currMin] = currentTime.split(':').map(Number);
  if (isNaN(currHour) || isNaN(currMin)) return;
  const currMinutes = currHour * 60 + currMin;

  for (const slotTime of times) {
    const slotKey = `${todayDate}_${slotTime}`;
    const [slotHour, slotMin] = slotTime.split(':').map(Number);
    if (isNaN(slotHour) || isNaN(slotMin)) continue;

    const slotMinutes = slotHour * 60 + slotMin;

    // A slot is triggered if currentTime is within [slotMinutes, slotMinutes + 45]
    // This allows recovery if the worker was busy processing another job or server restarted
    if (currMinutes >= slotMinutes && currMinutes <= slotMinutes + 45) {
      const slotRun = await getSetting(`SCHEDULE_SLOT_RUN_${slotKey}`);
      if (slotRun === 'completed' || slotRun === 'processing') {
        continue; // Already triggered today
      }

      // Mark processing to lock the slot
      await prisma.setting.upsert({
        where: { key: `SCHEDULE_SLOT_RUN_${slotKey}` },
        update: { value: 'processing' },
        create: { key: `SCHEDULE_SLOT_RUN_${slotKey}`, value: 'processing' }
      });

      console.log(`[SCHEDULER] ⏰ Scheduled posting time active: ${slotTime} IST (Key: ${slotKey}, current time: ${currentTime} IST)`);
      await executeScheduledSlot(slotTime, slotKey);
      break; // Run one slot per tick
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

  // Independent scheduler loop every 5 seconds (never blocked by video rendering or FFmpeg!)
  (async () => {
    while (true) {
      try {
        await runScheduler();
      } catch (err: any) {
        console.error('[SCHEDULER] Unexpected scheduler loop error:', err.message);
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  })();

  // Main queue processor loop
  while (true) {
    try {
      await processNextJob();
    } catch (err: any) {
      console.error('[WORKER] Unexpected worker loop error:', err.message);
    }
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

startWorker().catch(console.error);
