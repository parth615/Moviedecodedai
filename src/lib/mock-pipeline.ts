import { prisma } from './prisma';

export async function mockGenerateTopics() {
  const topics = [
    { title: 'The Hidden Meaning in Inception\'s Ending', category: 'Movie theories', viralityScore: 92, difficultyScore: 60 },
    { title: 'Why Interstellar\'s Black Hole Was Scientifically Accurate', category: 'Movie hidden details', viralityScore: 88, difficultyScore: 70 },
    { title: 'The Psychology of the Joker: A Deep Dive', category: 'Psychology', viralityScore: 95, difficultyScore: 50 },
    { title: 'How Marvel Built a Billion Dollar Empire', category: 'Business/money stories', viralityScore: 85, difficultyScore: 40 },
    { title: 'The Technology Behind Avatar\'s CGI', category: 'Technology stories', viralityScore: 82, difficultyScore: 80 },
    { title: 'Bollywood\'s Untold Rivalries in the 90s', category: 'Bollywood stories', viralityScore: 90, difficultyScore: 65 },
    { title: 'The Real Story of The Wolf of Wall Street', category: 'Hollywood stories', viralityScore: 89, difficultyScore: 55 },
    { title: 'Matrix: Was Neo Actually the Villain?', category: 'Movie theories', viralityScore: 94, difficultyScore: 55 },
    { title: 'How Apple Changed Product Placement in Movies', category: 'Business/money stories', viralityScore: 81, difficultyScore: 45 },
    { title: 'The Dark Psychology of Fight Club', category: 'Psychology', viralityScore: 96, difficultyScore: 50 },
  ];

  for (const t of topics) {
    await prisma.topic.create({
      data: {
        title: t.title,
        category: t.category,
        viralityScore: t.viralityScore,
        difficultyScore: t.difficultyScore,
        hook: `Did you ever notice this in ${t.title}?`,
        description: `A deep dive into ${t.title}.`,
        status: 'PENDING',
        sourceUrls: JSON.stringify(['https://example.com/source1', 'https://example.com/source2']),
      }
    });
  }
}

export async function mockResearchTopic(topicId: string) {
  await prisma.research.create({
    data: {
      topicId: topicId,
      findings: JSON.stringify({ summary: 'Found multiple credible sources confirming the theory.', angles: ['Psychological', 'Cinematic'] }),
      confidenceScore: 90,
      status: 'COMPLETED'
    }
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { status: 'RESEARCHED' }
  });
}

export async function mockGenerateScript(topicId: string) {
  const scenes = [
    { sceneNumber: 1, duration: 5, narration: "Wait, you won't believe this...", visualPrompt: "Shocked face", visualType: "image" },
    { sceneNumber: 2, duration: 15, narration: "Context setup...", visualPrompt: "Cinematic shot", visualType: "video" },
  ];

  const claims = [
    { claim: "The director confirmed it", type: "confirmed", source: "Interview 2010" }
  ];

  await prisma.script.create({
    data: {
      topicId: topicId,
      title: "Generated Script Title",
      hook: "Wait, you won't believe this...",
      narration: "Wait, you won't believe this... Context setup... Story... Payoff... What do you think?",
      scenes: JSON.stringify(scenes),
      cta: "What do you think? Let me know in the comments!",
      description: "Auto-generated script description",
      hashtags: JSON.stringify(['#movies', '#theories']),
      language: "hinglish",
      wordCount: 120,
      status: 'DRAFT',
      claims: JSON.stringify(claims),
    }
  });

  await prisma.topic.update({
    where: { id: topicId },
    data: { status: 'SCRIPTED' }
  });
}

export async function mockFactCheck(scriptId: string) {
  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'FACT_CHECKED' }
  });
}

export async function mockGenerateVoice(scriptId: string) {
  await prisma.voiceAsset.create({
    data: {
      scriptId,
      audioUrl: 'https://mock.example.com/audio/mock-voice.mp3',
      duration: 65,
      provider: 'ElevenLabs (Mock)'
    }
  });

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'VOICE_GENERATED' }
  });
}

export async function mockGenerateVisuals(scriptId: string) {
  await prisma.visualAsset.createMany({
    data: [
      {
        scriptId,
        sceneIndex: 1,
        assetUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80',
        assetType: 'image',
        prompt: 'Cinematic shot of film reel',
        provider: 'MockImageGen'
      },
      {
        scriptId,
        sceneIndex: 2,
        assetUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
        assetType: 'image',
        prompt: 'Surprised face in dark room',
        provider: 'MockImageGen'
      }
    ]
  });

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'VISUALS_GENERATED' }
  });
}

export async function mockRenderVideo(scriptId: string) {
  await prisma.video.create({
    data: {
      scriptId,
      fileUrl: 'https://mock.example.com/video/mock-final.mp4',
      duration: 65,
      resolution: '1080x1920',
      status: 'COMPLETED',
      qaScore: 95
    }
  });

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'RENDERED' }
  });
}

// ==========================================
// PHASE 4 ADDITIONS
// ==========================================

export async function mockRunQA(videoId: string) {
  const video = await prisma.video.update({
    where: { id: videoId },
    data: {
      qaScore: 95, // Mock score
      status: 'READY_FOR_APPROVAL'
    },
    include: {
      script: {
        include: { topic: true }
      }
    }
  });

  await prisma.script.update({
    where: { id: video.scriptId },
    data: { status: 'QA_PASSED' }
  });

  return video;
}

export async function mockTelegramService(video: any) {
  console.log(`
  [TELEGRAM MOCK] Message sent to Admin:
  🎬 VIDEO READY
  
  Title: ${video.script.topic.title}
  Category: ${video.script.topic.category}
  QA: ${video.qaScore}/100
  Virality: ${video.script.topic.viralityScore}/100
  
  Buttons: [✅ APPROVE] [🔄 REGENERATE] [❌ REJECT]
  `);
}

// ==========================================
// PHASE 5 ADDITIONS
// ==========================================

export async function mockPublishVideo(videoId: string) {
  // Create YouTube publication
  await prisma.publication.create({
    data: {
      videoId,
      platform: 'YOUTUBE_SHORTS',
      externalId: 'yt_' + Math.random().toString(36).substr(2, 9),
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  });

  // Create Instagram publication
  await prisma.publication.create({
    data: {
      videoId,
      platform: 'INSTAGRAM_REELS',
      externalId: 'ig_' + Math.random().toString(36).substr(2, 9),
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  });

  const video = await prisma.video.update({
    where: { id: videoId },
    data: { status: 'PUBLISHED' },
    include: { script: true }
  });

  await prisma.script.update({
    where: { id: video.scriptId },
    data: { status: 'PUBLISHED' }
  });
}

export async function mockFetchAnalytics(publicationId: string) {
  const views = Math.floor(Math.random() * 50000) + 1000;
  const likes = Math.floor(views * (Math.random() * 0.1 + 0.05)); // 5-15% likes
  const comments = Math.floor(likes * (Math.random() * 0.1 + 0.01)); // 1-10% comments
  const retentionRate = Math.random() * 30 + 40; // 40-70% retention

  await prisma.analytics.create({
    data: {
      publicationId,
      views,
      likes,
      comments,
      retentionRate,
      fetchedAt: new Date()
    }
  });

  // Learning Loop: Update topic virality score slightly
  const pub = await prisma.publication.findUnique({
    where: { id: publicationId },
    include: { video: { include: { script: { include: { topic: true } } } } }
  });

  if (pub?.video?.script?.topic) {
    const topic = pub.video.script.topic;
    // Boost score if retention is > 60%, lower if < 50%
    let scoreDelta = 0;
    if (retentionRate > 60) scoreDelta = 2;
    else if (retentionRate < 50) scoreDelta = -2;

    await prisma.topic.update({
      where: { id: topic.id },
      data: {
        viralityScore: Math.min(100, Math.max(0, (topic.viralityScore || 50) + scoreDelta))
      }
    });
  }
}
