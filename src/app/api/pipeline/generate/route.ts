import { NextResponse } from 'next/server';
import { enqueueJob } from '@/lib/queue';
import { getSetting } from '@/lib/settings';
import { prisma } from '@/lib/prisma';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrCreateUser } from '@/lib/user';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await getOrCreateUser(session.user);
    if (!user || user.credits < 1) {
      return NextResponse.json({ success: false, error: "Insufficient credits. Please buy more." }, { status: 402 });
    }

    const isPaused = await getSetting('AUTOMATION_PAUSED');
    if (isPaused === 'true') {
      return NextResponse.json({ success: false, error: 'Automation is paused by admin.' }, { status: 403 });
    }

    // ── Anti-abuse safety limit (max 50/day per user) ─────────────────────
    const rawLimit = parseInt(await getSetting('DAILY_VIDEO_LIMIT')) || 50;
    const limit = Math.max(rawLimit, 50); // Ensure paying users are not blocked by low legacy defaults
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTopics = await prisma.topic.count({
      where: { userId: user.id, createdAt: { gte: todayStart } }
    });

    if (todayTopics >= limit) {
      return NextResponse.json(
        { success: false, error: `Daily safety limit of ${limit} videos reached (${todayTopics} generated today). Please resume tomorrow or contact support.` },
        { status: 429 }
      );
    }

    // Deduct 1 credit safely with auto-refund on job enqueue failure
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1 } }
    });

    try {
      // Enqueue 1 focused video generation so user gets instant 30-40s pipeline progress!
      await enqueueJob('GENERATE_TOPICS', { userId: user.id, count: 1 });
    } catch (enqueueError) {
      // Auto-refund credit
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { increment: 1 } }
      });
      throw enqueueError;
    }

    return NextResponse.json({
      success: true,
      message: `Pipeline started! Your video is being crafted right now.`
    });
  } catch (error: any) {
    console.error('Pipeline Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
