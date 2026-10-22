import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    if (!videoId) {
      return NextResponse.json({ error: 'Missing videoId' }, { status: 400 });
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: { publications: true, approval: true }
    });

    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const ytPub = video.publications.find(
      (p) => p.platform === 'YOUTUBE_SHORTS' && p.status === 'PUBLISHED'
    );

    return NextResponse.json({
      id: video.id,
      status: video.status,
      youtubeId: ytPub?.externalId || null,
      feedback: video.approval?.feedback || null,
      updatedAt: video.updatedAt
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
