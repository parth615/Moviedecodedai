import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { getSetting, setSetting } from '@/lib/settings';
import { enqueueJob } from '@/lib/queue';

export const dynamic = 'force-dynamic';

function getIstTimeInfo(times: string[]) {
  const now = new Date();
  const timeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  });
  const currentIst = timeFormatter.format(now);

  // Find next slot
  const sorted = [...times].sort();
  let nextSlot = sorted.find((t) => t > currentIst);
  if (!nextSlot && sorted.length > 0) {
    // Rolls over to the first slot of tomorrow
    nextSlot = `${sorted[0]} (Tomorrow)`;
  }

  return { currentIst, nextSlot: nextSlot || 'None scheduled' };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(session.user);
    const [scheduleStr, scheduleMode, autoPublish, autoGen] = await Promise.all([
      getSetting('POSTING_SCHEDULE'),
      getSetting('SCHEDULE_MODE'),
      getSetting('AUTO_PUBLISH'),
      getSetting('SCHEDULE_AUTO_GENERATE')
    ]);

    const times = scheduleStr
      .split(',')
      .map((t: string) => t.trim())
      .filter(Boolean);

    const { currentIst, nextSlot } = getIstTimeInfo(times);

    // Check if YouTube credential is linked
    const ytCred = await prisma.oAuthCredential.findFirst({
      where: {
        provider: 'youtube',
        OR: [{ userId: user?.id }, { userId: null }]
      }
    });

    return NextResponse.json({
      success: true,
      schedule: times,
      scheduleMode: scheduleMode || 'active',
      autoPublish: autoPublish === 'true',
      autoGenerate: autoGen !== 'false',
      currentTimeIst: currentIst,
      nextSlotIst: nextSlot,
      totalDailySlots: times.length,
      connectedYouTube: Boolean(ytCred?.refreshToken),
      credits: user?.credits || 0
    });
  } catch (error: any) {
    console.error('[SCHEDULE_API_GET_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(session.user);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action } = body;

    // 1. Toggle Hands-Free Schedule Mode (active / paused)
    if (action === 'toggle_schedule') {
      const currentMode = await getSetting('SCHEDULE_MODE');
      const newMode = currentMode === 'paused' ? 'active' : 'paused';
      await setSetting('SCHEDULE_MODE', newMode);
      if (newMode === 'active') {
        await setSetting('AUTO_PUBLISH', 'true');
        await setSetting('AUTOPILOT_USER_ID', user.id);
      }
      return NextResponse.json({
        success: true,
        scheduleMode: newMode,
        message: newMode === 'active' ? 'Hands-Free Schedule Activated!' : 'Schedule Paused.'
      });
    }

    // 2. Set Preset (e.g. 8 Videos/Day or 4 Videos/Day)
    if (action === 'set_preset') {
      const { preset } = body;
      let times: string[] = [];

      if (preset === '8_daily') {
        // 8 evenly spaced peak slots across daytime and evening
        times = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00', '21:00', '23:00'];
      } else if (preset === '4_daily') {
        times = ['10:00', '14:00', '18:00', '21:00'];
      } else if (preset === '12_daily') {
        times = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00', '18:30', '20:00', '21:30', '23:00', '00:30'];
      } else {
        return NextResponse.json({ success: false, error: 'Invalid preset name' }, { status: 400 });
      }

      await setSetting('POSTING_SCHEDULE', times.join(', '));
      await setSetting('SCHEDULE_MODE', 'active');
      await setSetting('AUTO_PUBLISH', 'true');
      await setSetting('AUTOPILOT_USER_ID', user.id);

      const { currentIst, nextSlot } = getIstTimeInfo(times);

      return NextResponse.json({
        success: true,
        message: `Preset activated: ${times.length} videos scheduled daily!`,
        schedule: times,
        scheduleMode: 'active',
        nextSlotIst: nextSlot,
        currentTimeIst: currentIst
      });
    }

    // 3. Save Custom Times Array
    if (action === 'set_times') {
      const { times } = body;
      if (!Array.isArray(times) || times.length === 0) {
        return NextResponse.json({ success: false, error: 'Please specify at least 1 posting time.' }, { status: 400 });
      }

      // Validate HH:MM format
      const validTimes = times
        .map((t: string) => t.trim())
        .filter((t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t));

      if (validTimes.length === 0) {
        return NextResponse.json({ success: false, error: 'No valid HH:MM times provided.' }, { status: 400 });
      }

      // Sort chronologically and deduplicate
      const uniqueTimes = Array.from(new Set(validTimes)).sort();
      await setSetting('POSTING_SCHEDULE', uniqueTimes.join(', '));
      await setSetting('AUTOPILOT_USER_ID', user.id);

      const { currentIst, nextSlot } = getIstTimeInfo(uniqueTimes);

      return NextResponse.json({
        success: true,
        message: `Saved ${uniqueTimes.length} posting times.`,
        schedule: uniqueTimes,
        nextSlotIst: nextSlot,
        currentTimeIst: currentIst
      });
    }

    // 4. Trigger Instant Scheduled Run Now (for testing or immediate release)
    if (action === 'trigger_now') {
      if (user.credits < 1) {
        return NextResponse.json({ success: false, error: 'Insufficient credits (need at least 1 credit).' }, { status: 402 });
      }

      // Ensure auto-publish is active
      await setSetting('AUTO_PUBLISH', 'true');
      await setSetting('AUTOPILOT_USER_ID', user.id);

      // Check for fresh approved or ready video (from last 24 hours) first
      const approvedVideo = await prisma.video.findFirst({
        where: {
          status: 'APPROVED',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        orderBy: { updatedAt: 'asc' }
      });

      if (approvedVideo) {
        await enqueueJob('PUBLISH_VIDEO', { videoId: approvedVideo.id });
        return NextResponse.json({
          success: true,
          message: `Dispatched pre-approved video (${approvedVideo.id}) to YouTube Shorts publisher!`
        });
      }

      const readyVideo = await prisma.video.findFirst({
        where: {
          status: 'READY_FOR_APPROVAL',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        },
        orderBy: { updatedAt: 'asc' }
      });

      if (readyVideo) {
        await prisma.approval.upsert({
          where: { videoId: readyVideo.id },
          update: { status: 'APPROVED', reviewer: 'ManualTrigger', approvedAt: new Date() },
          create: { videoId: readyVideo.id, status: 'APPROVED', reviewer: 'ManualTrigger', approvedAt: new Date() }
        });
        await prisma.video.update({
          where: { id: readyVideo.id },
          data: { status: 'APPROVED' }
        });
        await enqueueJob('PUBLISH_VIDEO', { videoId: readyVideo.id });
        return NextResponse.json({
          success: true,
          message: `Auto-approved and dispatched video (${readyVideo.id}) to YouTube Shorts publisher!`
        });
      }

      // Deduct 1 credit & enqueue fresh generation
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } }
      });

      await enqueueJob('GENERATE_TOPICS', { userId: user.id, count: 1 });

      return NextResponse.json({
        success: true,
        message: 'Instant scheduled slot triggered! 1 credit used. Video is generating and will publish to YouTube Shorts upon render completion.'
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[SCHEDULE_API_POST_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
