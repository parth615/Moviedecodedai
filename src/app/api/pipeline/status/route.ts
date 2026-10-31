import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrCreateUser } from '@/lib/user';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({
        activeStageIndex: -1,
        activeStageLabel: 'Idle',
        completedStages: [],
        isProcessing: false,
      });
    }

    const user = await getOrCreateUser(session.user);
    if (!user) {
      return NextResponse.json({
        activeStageIndex: -1,
        activeStageLabel: 'Idle',
        completedStages: [],
        isProcessing: false,
      });
    }

    // 1. Check for active/pending background jobs
    const activeJobs = await prisma.job.findMany({
      where: {
        status: { in: ['PENDING', 'PROCESSING'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // 2. Find the user's latest topic
    const latestTopic = await prisma.topic.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        research: true,
        script: {
          include: {
            voiceAsset: true,
            visualAssets: true,
            video: {
              include: {
                publications: true,
              },
            },
          },
        },
      },
    });

    // Map stages:
    // 0: Ideas
    // 1: Research
    // 2: Scripts
    // 3: Voice
    // 4: Visuals
    // 5: Render
    // 6: QA
    // 7: Approval
    // 8: Published

    let completedStages: number[] = [];
    let activeStageIndex = -1;
    let activeStageLabel = 'Pipeline Idle';
    let isProcessing = false;
    let detailedMessage = '';
    let videoUrl = '';
    let videoId = '';

    // Auto-rescue any zombie PROCESSING job older than 3 minutes
    try {
      await prisma.job.updateMany({
        where: {
          status: 'PROCESSING',
          updatedAt: { lt: new Date(Date.now() - 3 * 60 * 1000) }
        },
        data: { status: 'PENDING' }
      });
    } catch (_) {}

    // Check if user has an active GENERATE_TOPICS job or any active job in queue
    const hasActiveJob = activeJobs.length > 0;
    const isGeneratingTopic = activeJobs.some(j => j.name === 'GENERATE_TOPICS');

    if (latestTopic) {
      // Stage 0: Ideas
      completedStages.push(0);

      // Stage 1: Research
      if (latestTopic.research) completedStages.push(1);

      // Stage 2: Script
      if (latestTopic.script) completedStages.push(2);

      // Stage 3: Voice
      if (latestTopic.script?.voiceAsset) completedStages.push(3);

      // Stage 4: Visuals
      if (latestTopic.script?.visualAssets && latestTopic.script.visualAssets.length > 0) completedStages.push(4);

      // Stage 5: Render
      const video = latestTopic.script?.video;
      if (video) {
        completedStages.push(5);
        videoId = video.id;
        videoUrl = video.fileUrl;

        // Stage 6: QA
        if (video.qaScore !== null || ['READY_FOR_APPROVAL', 'APPROVED', 'PUBLISHED', 'COMPLETED'].includes(video.status)) {
          completedStages.push(6);
        }

        // Stage 7: Approval
        if (['APPROVED', 'PUBLISHED'].includes(video.status)) {
          completedStages.push(7);
        }

        // Stage 8: Published
        if (video.status === 'PUBLISHED') {
          completedStages.push(8);
        }
      }
    }

    const video = latestTopic?.script?.video;

    // Determine the CURRENT ACTIVE STAGE based on active jobs first, then latest entity
    if (hasActiveJob && activeJobs.length > 0) {
      isProcessing = true;
      const currentJob = activeJobs[0];

      if (currentJob.name === 'GENERATE_TOPICS') {
        activeStageIndex = 0;
        activeStageLabel = 'Generating Viral Ideas';
        detailedMessage = 'Gemini AI is researching viral hooks & trending angles...';
      } else if (currentJob.name === 'RESEARCH_TOPIC') {
        activeStageIndex = 1;
        activeStageLabel = 'Deep Research & Fact-Checking';
        detailedMessage = 'Mining Wikipedia and historical archives...';
      } else if (currentJob.name === 'GENERATE_SCRIPT' || currentJob.name === 'FACT_CHECK') {
        activeStageIndex = 2;
        activeStageLabel = 'Writing Viral Script';
        detailedMessage = 'Crafting 3-second visual hook and narrative arc...';
      } else if (currentJob.name === 'GENERATE_VOICE') {
        activeStageIndex = 3;
        activeStageLabel = 'Generating Neural Voiceover';
        detailedMessage = 'Synthesizing studio-grade audio with ElevenLabs...';
      } else if (currentJob.name === 'GENERATE_VISUALS' || currentJob.name === 'GENERATE_SUBTITLES') {
        activeStageIndex = 4;
        activeStageLabel = 'Creating Visuals & Subtitles';
        detailedMessage = 'Generating cinematic scenes & kinetic ASS subtitles...';
      } else if (currentJob.name === 'RENDER_VIDEO') {
        activeStageIndex = 5;
        activeStageLabel = 'Rendering 1080p Video';
        detailedMessage = 'FFmpeg GPU engine is assembling split-screen video...';
      } else if (currentJob.name === 'RUN_QA') {
        activeStageIndex = 6;
        activeStageLabel = 'Quality Assurance & Scoring';
        detailedMessage = 'Verifying audio sync, pacing, and visual safety...';
      } else if (currentJob.name === 'PUBLISH_VIDEO') {
        activeStageIndex = 8;
        activeStageLabel = 'Publishing to YouTube';
        detailedMessage = 'Uploading directly to YouTube Shorts...';
      } else {
        activeStageIndex = 0;
        activeStageLabel = currentJob.name.replace(/_/g, ' ');
        detailedMessage = 'Processing pipeline job...';
      }
    } else if (video) {
      if (video.status === 'PUBLISHED') {
        activeStageIndex = 8;
        activeStageLabel = 'Published to YouTube';
        detailedMessage = 'Live on YouTube Shorts!';
        isProcessing = false;
      } else if (['READY_FOR_APPROVAL', 'COMPLETED'].includes(video.status)) {
        activeStageIndex = 7;
        activeStageLabel = 'Awaiting Your Approval';
        detailedMessage = 'Video rendered successfully! Click below to review and publish.';
        isProcessing = false;
      } else if (video.status === 'APPROVED') {
        activeStageIndex = 8;
        activeStageLabel = 'Ready to Publish';
        detailedMessage = 'Video approved! Ready to deploy to YouTube Shorts.';
        isProcessing = false;
      } else if (video.qaScore === null) {
        activeStageIndex = 6;
        activeStageLabel = 'Quality Assurance & Scoring';
        detailedMessage = 'Verifying audio sync, pacing, and visual safety...';
        isProcessing = false;
      } else {
        activeStageIndex = 7;
        activeStageLabel = 'Awaiting Your Approval';
        detailedMessage = 'Video rendered successfully! Click below to review and publish.';
        isProcessing = false;
      }
    } else {
      isProcessing = false;
      activeStageIndex = -1;
      activeStageLabel = 'Pipeline Idle';
      detailedMessage = 'Ready to generate a new video. Auto-Pilot or manual generation ready.';
    }

    // Deduplicate completed stages and sort
    completedStages = Array.from(new Set(completedStages)).sort((a, b) => a - b);

    // Calculate percentage
    const progressPercent = Math.min(
      100,
      Math.round(((completedStages.length + (activeStageIndex >= 0 ? 0.5 : 0)) / 9) * 100)
    );

    return NextResponse.json({
      success: true,
      activeStageIndex,
      activeStageLabel,
      completedStages,
      isProcessing,
      detailedMessage,
      progressPercent,
      topicTitle: latestTopic?.title || '',
      videoId,
      videoUrl,
    });
  } catch (error: any) {
    console.error('Error fetching pipeline status:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
