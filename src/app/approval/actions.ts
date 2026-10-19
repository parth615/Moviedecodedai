'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { enqueueJob } from '@/lib/queue';

export async function approveVideo(videoId: string) {
  await prisma.approval.upsert({
    where: { videoId },
    update: {
      status: 'APPROVED',
      reviewer: 'Admin',
      approvedAt: new Date(),
      feedback: null
    },
    create: {
      videoId,
      status: 'APPROVED',
      reviewer: 'Admin',
      approvedAt: new Date(),
      feedback: null
    }
  });

  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'APPROVED' }
  });

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (video) {
    await prisma.script.update({
      where: { id: video.scriptId },
      data: { status: 'READY_FOR_PUBLISHING' }
    });
    await enqueueJob('PUBLISH_VIDEO', { videoId });
  }

  revalidatePath('/approval');
}

export async function resetVideoToReady(videoId: string) {
  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'READY_FOR_APPROVAL' }
  });
  revalidatePath('/approval');
}

export async function rejectVideo(videoId: string) {
  // BUG FIX: was prisma.approval.create() — crashes if approval already exists
  await prisma.approval.upsert({
    where: { videoId },
    update: {
      status: 'REJECTED',
      reviewer: 'Admin',
      rejectedAt: new Date(),
      feedback: 'Manual rejection'
    },
    create: {
      videoId,
      status: 'REJECTED',
      reviewer: 'Admin',
      rejectedAt: new Date(),
      feedback: 'Manual rejection'
    }
  });

  await prisma.video.update({
    where: { id: videoId },
    data: { status: 'REJECTED' }
  });

  revalidatePath('/approval');
}

export async function regenerateVideo(videoId: string, actionType: string) {
  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { script: true }
  });
  if (!video) return;

  if (actionType === 'VISUALS') {
    await prisma.script.update({
      where: { id: video.scriptId },
      data: { status: 'VOICE_GENERATED' }
    });
    await prisma.video.delete({ where: { id: videoId } });
    await enqueueJob('GENERATE_VISUALS', { scriptId: video.scriptId });
  } else if (actionType === 'VOICE') {
    await prisma.voiceAsset.deleteMany({ where: { scriptId: video.scriptId } });
    await prisma.script.update({
      where: { id: video.scriptId },
      data: { status: 'FACT_CHECKED' }
    });
    await prisma.video.delete({ where: { id: videoId } });
    await enqueueJob('GENERATE_VOICE', { scriptId: video.scriptId });
  } else if (actionType === 'SCRIPT') {
    // BUG FIX: was passing scriptId as topicId — completely wrong
    await prisma.script.update({
      where: { id: video.scriptId },
      data: { status: 'RESEARCHED' }
    });
    await prisma.video.delete({ where: { id: videoId } });
    await enqueueJob('GENERATE_SCRIPT', { topicId: video.script.topicId });
  } else {
    // Full re-render
    await prisma.video.delete({ where: { id: videoId } });
    await enqueueJob('RENDER_VIDEO', { scriptId: video.scriptId });
  }

  revalidatePath('/approval');
}

export async function updateVideoSettings(formData: FormData) {
  const videoId = formData.get('videoId') as string;
  const templateId = formData.get('templateId') as string;
  const gameplayAssetId = formData.get('gameplayAssetId') as string;
  const intensity = parseFloat(formData.get('animationIntensity') as string);
  const action = formData.get('submitAction') as string;

  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) return;

  const finalGameplayAssetId =
    !gameplayAssetId || gameplayAssetId === '' || gameplayAssetId === 'none' || gameplayAssetId === 'null'
      ? null
      : gameplayAssetId;

  await prisma.script.update({
    where: { id: video.scriptId },
    data: {
      templateId,
      gameplayAssetId: finalGameplayAssetId,
      animationIntensity: isNaN(intensity) ? 1.0 : intensity
    }
  });

  if (action === 'REGENERATE_RENDER') {
    await prisma.video.delete({ where: { id: videoId } });
    await enqueueJob('RENDER_VIDEO', { scriptId: video.scriptId });
  } else if (action === 'REGENERATE_CAPTIONS') {
    await prisma.script.update({
      where: { id: video.scriptId },
      data: { status: 'VOICE_GENERATED' }
    });
    await prisma.video.delete({ where: { id: videoId } });
    await enqueueJob('GENERATE_SUBTITLES', { scriptId: video.scriptId });
  }

  revalidatePath('/approval');
}
