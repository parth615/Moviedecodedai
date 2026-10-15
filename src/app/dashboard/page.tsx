import { prisma } from '@/lib/prisma';
import { getSetting } from '@/lib/settings';
import { DashboardClient } from '../DashboardClient';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  // ── Real DB stats ───────────────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalTopics,
    pendingApproval,
    approvedVideos,
    publishedVideos,
    todayTopics,
    dailyLimit,
    isPaused,
  ] = await Promise.all([
    prisma.topic.count({ where: { userId, createdAt: { gte: todayStart } } }),
    prisma.video.count({ where: { script: { topic: { userId } }, status: 'READY_FOR_APPROVAL' } }),
    prisma.video.count({ where: { script: { topic: { userId } }, status: 'APPROVED' } }),
    prisma.video.count({ where: { script: { topic: { userId } }, status: 'PUBLISHED' } }),
    prisma.topic.count({ where: { userId, createdAt: { gte: todayStart } } }),
    getSetting('DAILY_VIDEO_LIMIT'),
    getSetting('AUTOMATION_PAUSED'),
  ]);

  const stats = {
    generated: `${todayTopics}/${dailyLimit}`,
    pendingApproval,
    approved: approvedVideos,
    published: publishedVideos,
  };

  return (
    <DashboardClient
      stats={stats}
      isPaused={isPaused === 'true'}
    />
  );
}
