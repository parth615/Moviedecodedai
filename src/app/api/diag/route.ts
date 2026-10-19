import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { enqueueJob } from '@/lib/queue';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ── Diagnostic Action: Grant credits to all users ───────────
    if (action === 'grant_credits') {
      const updated = await prisma.user.updateMany({
        data: { credits: 15 }
      });
      return NextResponse.json({ success: true, message: `Granted 15 credits to ${updated.count} users` });
    }

    // ── Diagnostic Action: Trigger demo pipeline ─────────────────
    if (action === 'trigger_demo') {
      const firstUser = await prisma.user.findFirst();
      if (!firstUser) {
        return NextResponse.json({ error: 'No user exists in DB to attach topic to' }, { status: 400 });
      }
      const job = await enqueueJob('GENERATE_TOPICS', { userId: firstUser.id, count: 1 });
      return NextResponse.json({ success: true, message: 'Enqueued GENERATE_TOPICS', jobId: job.id, userId: firstUser.id });
    }

    const dbUrl = process.env.DATABASE_URL || 'not_set';
    
    const [userCount, topicCount, scriptCount, videoCount, jobCount] = await Promise.all([
      prisma.user.count(),
      prisma.topic.count(),
      prisma.script.count(),
      prisma.video.count(),
      prisma.job.count(),
    ]);

    const users = await prisma.user.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        createdAt: true,
      }
    });

    const settings = await prisma.setting.findMany();

    const latestJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        name: true,
        status: true,
        error: true,
        attemptCount: true,
        logs: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const latestTopics = await prisma.topic.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        script: {
          include: {
            voiceAsset: true,
            visualAssets: true,
            video: true,
          }
        }
      }
    });

    const dirList = (dir: string) => {
      try {
        if (!fs.existsSync(dir)) return `dir_does_not_exist: ${dir}`;
        return fs.readdirSync(dir);
      } catch (e: any) {
        return `error_reading ${dir}: ${e.message}`;
      }
    };

    return NextResponse.json({
      dbUrl,
      cwd: process.cwd(),
      envCheck: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nextAuthUrl: process.env.NEXTAUTH_URL || 'not_set',
      },
      counts: {
        users: userCount,
        topics: topicCount,
        scripts: scriptCount,
        videos: videoCount,
        jobs: jobCount,
      },
      users,
      settings,
      latestJobs,
      latestTopics,
      storage: {
        publicVideo: dirList(path.join(process.cwd(), 'public', 'video')),
        dataVideo: dirList('/data/video'),
        publicGameplay: dirList(path.join(process.cwd(), 'public', 'gameplay')),
        dataGameplay: dirList('/data/gameplay'),
        publicAudio: dirList(path.join(process.cwd(), 'public', 'audio')),
        dataAudio: dirList('/data/audio'),
        publicImagesCount: typeof dirList(path.join(process.cwd(), 'public', 'images')) === 'object' ? (dirList(path.join(process.cwd(), 'public', 'images')) as any).length : 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
