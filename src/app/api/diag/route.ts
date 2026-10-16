import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbUrl = process.env.DATABASE_URL || 'not_set';
    
    const [userCount, topicCount, scriptCount, videoCount, jobCount] = await Promise.all([
      prisma.user.count(),
      prisma.topic.count(),
      prisma.script.count(),
      prisma.video.count(),
      prisma.job.count(),
    ]);

    const latestJobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
      select: {
        id: true,
        name: true,
        status: true,
        error: true,
        attemptCount: true,
        logs: true,
        createdAt: true,
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

    // Check directory contents
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
      counts: {
        users: userCount,
        topics: topicCount,
        scripts: scriptCount,
        videos: videoCount,
        jobs: jobCount,
      },
      latestJobs,
      latestTopics,
      storage: {
        publicVideo: dirList(path.join(process.cwd(), 'public', 'video')),
        dataVideo: dirList('/data/video'),
        publicAudio: dirList(path.join(process.cwd(), 'public', 'audio')),
        dataAudio: dirList('/data/audio'),
        publicImagesCount: typeof dirList(path.join(process.cwd(), 'public', 'images')) === 'object' ? (dirList(path.join(process.cwd(), 'public', 'images')) as any).length : 0,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
