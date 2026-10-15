import { NextResponse } from 'next/server';
import { enqueueJob } from '@/lib/queue';
import { getSetting } from '@/lib/settings';
import { prisma } from '@/lib/prisma';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please log in." }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.credits < 1) {
      return NextResponse.json({ success: false, error: "Insufficient credits. Please buy more." }, { status: 402 });
    }

    const isPaused = await getSetting('AUTOMATION_PAUSED');
    if (isPaused === 'true') {
      return NextResponse.json({ success: false, error: 'Automation is paused by admin.' }, { status: 403 });
    }

    // ── Daily limit enforcement ─────────────────────────────────────────────
    const limit = parseInt(await getSetting('DAILY_VIDEO_LIMIT')) || 10;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTopics = await prisma.topic.count({
      where: { userId: user.id, createdAt: { gte: todayStart } }
    });

    if (todayTopics >= limit) {
      return NextResponse.json(
        { success: false, error: `Daily limit of ${limit} topics reached (${todayTopics} created today). Increase the limit in Settings or wait until tomorrow.` },
        { status: 429 }
      );
    }

    // Deduct 1 credit
    await prisma.user.update({
      where: { id: user.id },
      data: { credits: { decrement: 1 } }
    });

    await enqueueJob('GENERATE_TOPICS', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: `Pipeline started. ${todayTopics}/${limit} topics used today.`
    });
  } catch (error: any) {
    console.error('Pipeline Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
