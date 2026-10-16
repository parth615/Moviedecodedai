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

    // Check if there is an active job matching any stage
    const currentJob = activeJobs[0];
    if (currentJob) {
      isProcessing = true;
      const jobName = currentJob.name;

      if (jobName === 'GENERATE_TOPICS') {
        activeStageIndex = 0;
        activeStageLabel = 'Generating Viral Ideas';
        detailedMessage = 'Gemini AI is researching viral hooks & trending angles...';
      } else if (jobName === 'RESEARCH_TOPIC') {
        completedStages.push(0);
        activeStageIndex = 1;
        activeStageLabel = 'Researching Topic Facts';
        detailedMessage = 'Extracting verified facts and narrative twists...';
      } else if (jobName === 'GENERATE_SCRIPT') {
        completedStages.push(0, 1);
        activeStageIndex = 2;
        activeStageLabel = 'Writing Viral Script';
        detailedMessage = 'Crafting punchy 3-second hook & scene breakdown...';
      } else if (jobName === 'FACT_CHECK' || jobName === 'GENERATE_VOICE') {
        completedStages.push(0, 1, 2);
        activeStageIndex = 3;
        activeStageLabel = 'Generating Neural Voiceover';
        detailedMessage = 'Synthesizing studio-grade audio with ElevenLabs...';
      } else if (jobName === 'GENERATE_SUBTITLES' || jobName === 'GENERATE_VISUALS') {
        completedStages.push(0, 1, 2, 3);
        activeStageIndex = 4;
        activeStageLabel = 'Creating Visuals & Subtitles';
        detailedMessage = 'Generating cinematic scenes & kinetic ASS subtitles...';
      } else if (jobName === 'RENDER_VIDEO') {
        completedStages.push(0, 1, 2, 3, 4);
        activeStageIndex = 5;
        activeStageLabel = 'Rendering 1080p Video';
        detailedMessage = 'FFmpeg GPU engine is assembling split-screen video...';
      } else if (jobName === 'RUN_QA') {
        completedStages.push(0, 1, 2, 3, 4, 5);
        activeStageIndex = 6;
        activeStageLabel = 'Quality Assurance & Scoring';
        detailedMessage = 'Verifying audio sync, pacing, and visual safety...';
      } else if (jobName === 'PUBLISH_VIDEO') {
        completedStages.push(0, 1, 2, 3, 4, 5, 6, 7);
        activeStageIndex = 8;
        activeStageLabel = 'Publishing to YouTube';
        detailedMessage = 'Uploading approved short to your connected YouTube channel...';
      }
    } else if (latestTopic) {
      // Determine progress from DB artifacts if no active job in queue
      if (latestTopic) completedStages.push(0);
      if (latestTopic.research) completedStages.push(1);
      if (latestTopic.script) completedStages.push(2);
      if (latestTopic.script?.voiceAsset) completedStages.push(3);
      if (latestTopic.script?.visualAssets && latestTopic.script.visualAssets.length > 0) completedStages.push(4);
      if (latestTopic.script?.video) completedStages.push(5);

      const video = latestTopic.script?.video;
      if (video) {
        videoId = video.id;
        videoUrl = video.fileUrl;

        if (video.qaScore !== null || video.status === 'READY_FOR_APPROVAL' || video.status === 'APPROVED' || video.status === 'PUBLISHED') {
          completedStages.push(6);
        }

        if (video.status === 'READY_FOR_APPROVAL') {
          activeStageIndex = 7;
          activeStageLabel = 'Awaiting Your Approval';
          detailedMessage = 'Video rendered successfully! Click below to review and publish.';
        } else if (video.status === 'APPROVED') {
          completedStages.push(7);
          activeStageIndex = 8;
          activeStageLabel = 'Ready to Publish';
          detailedMessage = 'Video approved! Ready to deploy to YouTube Shorts.';
        } else if (video.status === 'PUBLISHED') {
          completedStages.push(7, 8);
          activeStageIndex = -1;
          activeStageLabel = 'Published to YouTube';
          detailedMessage = 'Live on YouTube Shorts!';
        }
      }
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
