import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';
import { getSetting, setSetting } from '@/lib/settings';
import { enqueueJob } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getOrCreateUser(session.user);
    const [status, remainingStr, totalStr, autoPublish] = await Promise.all([
      getSetting('AUTOPILOT_STATUS'),
      getSetting('AUTOPILOT_REMAINING'),
      getSetting('AUTOPILOT_TOTAL'),
      getSetting('AUTO_PUBLISH'),
    ]);

    const remaining = parseInt(remainingStr, 10) || 0;
    const total = parseInt(totalStr, 10) || 0;

    return NextResponse.json({
      success: true,
      status: status || 'idle',
      remaining,
      total,
      autoPublish: autoPublish === 'true',
      credits: user?.credits || 0,
    });
  } catch (error: any) {
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
    const { action, count, mode, autoPublish } = body;

    if (action === 'toggle_auto_publish') {
      const enabled = autoPublish ? 'true' : 'false';
      await setSetting('AUTO_PUBLISH', enabled);
      return NextResponse.json({ success: true, autoPublish: enabled === 'true' });
    }

    if (action === 'stop') {
      await setSetting('AUTOPILOT_STATUS', 'idle');
      await setSetting('AUTOPILOT_REMAINING', '0');
      return NextResponse.json({ success: true, message: 'Auto-Pilot has been stopped.' });
    }

    if (action === 'start') {
      if (user.credits < 1) {
        return NextResponse.json(
          { success: false, error: 'Insufficient credits. Please top up your credits to launch Auto-Pilot.' },
          { status: 402 }
        );
      }

      const isUnlimited = mode === 'unlimited';
      const targetCount = isUnlimited ? -1 : Math.max(1, parseInt(count || '8', 10));
      const totalCount = isUnlimited ? user.credits : targetCount;

      // Ensure we don't start more than available credits in fixed mode
      if (!isUnlimited && targetCount > user.credits) {
        return NextResponse.json(
          { success: false, error: `You requested ${targetCount} videos but currently have ${user.credits} credits. Please top up or choose a lower batch size.` },
          { status: 400 }
        );
      }

      // Configure Auto-Pilot settings
      await setSetting('AUTOPILOT_STATUS', 'active');
      await setSetting('AUTOPILOT_USER_ID', user.id);
      await setSetting('AUTOPILOT_REMAINING', targetCount.toString());
      await setSetting('AUTOPILOT_TOTAL', totalCount.toString());
      await setSetting('AUTO_PUBLISH', 'true'); // Auto-publish is enabled during Auto-Pilot

      // Deduct 1 credit for the very first video in the autonomous batch
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } }
      });

      // Launch the first topic in the pipeline
      await enqueueJob('GENERATE_TOPICS', { userId: user.id, count: 1 });

      return NextResponse.json({
        success: true,
        message: `Auto-Pilot started! ${isUnlimited ? 'Generating and publishing until credits run out' : `Autonomous pipeline will create and publish ${targetCount} videos`}.`,
        status: 'active',
        remaining: targetCount,
        total: totalCount,
      });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('[AUTOPILOT_API_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
