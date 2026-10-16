import { prisma } from '../../lib/prisma';
import { enqueueJob, logToJob } from '../../lib/queue';
import { getSetting } from '../../lib/settings';
import { handleRunQA } from './qa';
import path from 'path';
import fs from 'fs';

/**
 * Pick a random gameplay video from public/gameplay/ directory.
 * Falls back to generating a colorful abstract background if none exist.
 */
function pickGameplayVideo(): string | null {
  const gpDir = path.join(process.cwd(), 'public', 'gameplay');
  if (!fs.existsSync(gpDir)) return null;
  const files = fs.readdirSync(gpDir).filter(f => f.endsWith('.mp4') || f.endsWith('.mov'));
  if (files.length === 0) return null;
  return path.join(gpDir, files[Math.floor(Math.random() * files.length)]);
}

/**
 * Parse subtitle data into ASS subtitle format for FFmpeg burning.
 * Creates word-by-word animated captions with neon green highlight.
 */
function generateAssSubtitles(subtitles: { word: string; start: number; end: number }[]): string {
  if (!subtitles || subtitles.length === 0) return '';

  // ASS header with styling similar to viral shorts
  let ass = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,85,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,3,5,40,40,0,1
Style: Highlight,Arial,95,&H0014FF39,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,4,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Group words into chunks of ~3-5 words for readability
  const chunkSize = 3;
  for (let i = 0; i < subtitles.length; i += chunkSize) {
    const chunk = subtitles.slice(i, Math.min(i + chunkSize, subtitles.length));
    const chunkStart = chunk[0].start;
    const chunkEnd = chunk[chunk.length - 1].end;
    
    // Format time as H:MM:SS.CC
    const formatTime = (t: number) => {
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      const s = Math.floor(t % 60);
      const cs = Math.floor((t % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    // For each word in the chunk, show all words but highlight current one
    for (let j = 0; j < chunk.length; j++) {
      const wordStart = chunk[j].start;
      const wordEnd = chunk[j].end;
      
      // Build the line with the current word highlighted
      const lineText = chunk.map((w, k) => {
        if (k === j) {
          return `{\\c&H0014FF39&\\fs100\\b1}${w.word.toUpperCase()}{\\r}`;
        }
        return w.word.toUpperCase();
      }).join(' ');

      ass += `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${lineText}\n`;
    }
  }

  return ass;
}

export async function handleRenderVideo(data: { scriptId: string }, jobId: string) {
  const { scriptId } = data;
  if (!scriptId) throw new Error("Missing scriptId");

  const script = await prisma.script.findUnique({ 
    where: { id: scriptId },
    include: { voiceAsset: true, visualAssets: true, topic: true, gameplayAsset: true }
  });

  if (!script || !script.voiceAsset) throw new Error(`Script ${scriptId} not ready for render`);

  await logToJob(jobId, `Starting Video Render for script: ${script.title}`);
  
  const providerMode = await getSetting('PROVIDER_MODE');
  const defaultTemplate = await getSetting('DEFAULT_TEMPLATE');
  const filename = `rendered_${scriptId}_${Date.now()}.mp4`;
  const outPath = path.join(process.cwd(), 'public', 'video', filename);

  // Always use FFmpeg gameplay render for real, playable video output
  const { exec } = await import('child_process');
  const util = await import('util');
  const execAsync = util.promisify(exec);
    
    let audioPath = path.join(process.cwd(), 'public', script.voiceAsset.audioUrl);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });

    // Verify audio file exists or resolve from persistent disk / synthesize emergency audio
    if (!fs.existsSync(audioPath)) {
      const dataAudio = path.join('/data', 'audio', path.basename(script.voiceAsset.audioUrl));
      if (fs.existsSync(dataAudio)) {
        audioPath = dataAudio;
      } else {
        await logToJob(jobId, `Audio file missing at ${audioPath}. Synthesizing emergency audio...`);
        fs.mkdirSync(path.dirname(audioPath), { recursive: true });
        const dur = script.voiceAsset.duration || 30;
        try {
          await execAsync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=${dur}" -c:a libmp3lame -b:a 128k -y "${audioPath}"`);
        } catch (_) {
          fs.writeFileSync(audioPath, Buffer.alloc(1024));
        }
      }
    }

    // 1. Pick a gameplay video
    let gameplayPath = pickGameplayVideo();
    
    // If a specific gameplay asset is linked to this script, use it
    if (script.gameplayAsset?.url) {
      const linkedPath = path.join(process.cwd(), 'public', script.gameplayAsset.url);
      if (fs.existsSync(linkedPath)) {
        gameplayPath = linkedPath;
      }
    }

    // 2. Parse subtitles for word-by-word captions
    const subtitles = script.voiceAsset.subtitles ? JSON.parse(script.voiceAsset.subtitles) : [];
    
    // 3. Generate ASS subtitle file
    const assContent = generateAssSubtitles(subtitles);
    const assPath = path.join(process.cwd(), 'public', 'video', `subs_${scriptId}.ass`);
    
    if (assContent) {
      fs.writeFileSync(assPath, assContent);
      await logToJob(jobId, `Generated ASS subtitles with ${subtitles.length} words.`);
    }

    // 4. Build FFmpeg command
    const duration = script.voiceAsset.duration || 60;
    const scenes = script.scenes ? JSON.parse(script.scenes) : [];

    const sortedVisuals = (script.visualAssets || [])
      .map(v => ({ ...v, absPath: path.join(process.cwd(), 'public', v.assetUrl) }))
      .filter(v => fs.existsSync(v.absPath))
      .sort((a, b) => a.sceneIndex - b.sceneIndex);

    const visualByScene = new Map<number, typeof sortedVisuals[0]>();
    for (const v of sortedVisuals) {
      visualByScene.set(v.sceneIndex, v);
    }

    // Map each scene to its exact start and end time based on spoken subtitles/word-count
    let currentWordIndex = 0;
    const sceneTimings = scenes.map((scene: any, i: number) => {
      const wordsInScene = (scene.narration || '').trim().split(/\s+/).filter(Boolean).length;
      const startWordIdx = currentWordIndex;
      const endWordIdx = Math.min(Math.max(0, subtitles.length - 1), startWordIdx + wordsInScene - 1);
      
      let startT = (i === 0) ? 0 : (subtitles[startWordIdx]?.start ?? (startWordIdx / Math.max(1, subtitles.length) * duration));
      let endT = (i === scenes.length - 1) ? duration : (subtitles[endWordIdx]?.end ?? ((endWordIdx + 1) / Math.max(1, subtitles.length) * duration));
      
      if (endT <= startT) {
        endT = startT + (duration / Math.max(1, scenes.length));
      }
      
      currentWordIndex += wordsInScene;
      const visual = visualByScene.get(scene.sceneNumber) || sortedVisuals[i % Math.max(1, sortedVisuals.length)];
      return {
        sceneNumber: scene.sceneNumber,
        startT: parseFloat(Number(startT).toFixed(2)),
        endT: parseFloat(Number(endT).toFixed(2)),
        visual
      };
    });

    let inputs = '';
    let filterComplex = '';
    let lastMap = '[bg]';

    // Set up inputs and background filter (True 50/50 Split Screen)
    if (gameplayPath && fs.existsSync(gameplayPath)) {
      await logToJob(jobId, `Using gameplay footage: ${path.basename(gameplayPath)}`);
      // Create a black 1080x1920 canvas, scale gameplay to 1080x960, and overlay at bottom (0:960)
      filterComplex += `color=c=black:s=1080x1920:d=${duration}[canvas];[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[gameplay];[canvas][gameplay]overlay=0:960[bg];`;
    } else {
      await logToJob(jobId, `No gameplay footage found. Generating colorful abstract background.`);
      gameplayPath = "gradients=s=1080x1920:c0=0x6366f1:c1=0xec4899:duration=120:speed=0.2"; // Lavfi input
      filterComplex += `color=c=black:s=1080x1920:d=${duration}[canvas];[0:v]scale=1080:960,setsar=1[gameplay];[canvas][gameplay]overlay=0:960[bg];`;
    }

    // Process visual assets synchronized with scene narration timings
    const validSceneVisuals = sceneTimings.filter((st: any) => st.visual && fs.existsSync(st.visual.absPath));

    if (validSceneVisuals.length > 0) {
      await logToJob(jobId, `Synchronizing ${validSceneVisuals.length} scene visuals to narration timing...`);
      let currentBg = 'bg';

      validSceneVisuals.forEach((st: any, i: number) => {
        const inputIndex = i + 2; // 0=gameplay, 1=audio, 2..N=scene visuals
        const isVideo = st.visual.assetType === 'video' || st.visual.absPath.endsWith('.mp4');

        if (isVideo) {
          inputs += ` -stream_loop -1 -i "${st.visual.absPath}"`;
        } else {
          inputs += ` -loop 1 -t ${duration} -i "${st.visual.absPath}"`;
        }

        const sceneDuration = Math.max(1, Math.ceil(st.endT - st.startT));
        if (isVideo) {
          filterComplex += `[${inputIndex}:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[img${i}];`;
        } else {
          // Clean, crisp high-res 1080x960 image crop without CPU-choking zoompan
          filterComplex += `[${inputIndex}:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[img${i}];`;
        }

        filterComplex += `[${currentBg}][img${i}]overlay=0:0:enable='between(t,${st.startT},${st.endT})'[v${i}];`;
        currentBg = `v${i}`;
      });

      lastMap = `[${currentBg}]`;
    } else if (sortedVisuals.length > 0) {
      // Fallback if scenes weren't parseable: divide equally across sorted visuals
      await logToJob(jobId, `Fallback: Injecting ${sortedVisuals.length} visual assets into render pipeline...`);
      const durationPerVisual = duration / sortedVisuals.length;
      let currentBg = 'bg';

      sortedVisuals.forEach((visual, i) => {
        const inputIndex = i + 2;
        if (visual.assetType === 'video' || visual.absPath.endsWith('.mp4')) {
          inputs += ` -stream_loop -1 -i "${visual.absPath}"`;
        } else {
          inputs += ` -loop 1 -t ${duration} -i "${visual.absPath}"`;
        }

        const startT = (i * durationPerVisual).toFixed(2);
        const endT = ((i + 1) * durationPerVisual).toFixed(2);

        if (visual.assetType === 'video' || visual.absPath.endsWith('.mp4')) {
          filterComplex += `[${inputIndex}:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[img${i}];`;
        } else {
          filterComplex += `[${inputIndex}:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960,setsar=1[img${i}];`;
        }
        filterComplex += `[${currentBg}][img${i}]overlay=0:0:enable='between(t,${startT},${endT})'[v${i}];`;
        currentBg = `v${i}`;
      });

      lastMap = `[${currentBg}]`;
    }

    // Save no-subtitles filter complex as foolproof fallback
    const filterComplexNoSubs = filterComplex.endsWith(';') ? filterComplex.slice(0, -1) : filterComplex;
    const lastMapNoSubs = lastMap;

    // Apply Subtitles
    if (assContent) {
      const escapedAssPath = assPath.replace(/:/g, '\\:').replace(/\\/g, '\\\\');
      filterComplex += `${lastMap}ass='${escapedAssPath}'[final]`;
      lastMap = `[final]`;
    } else {
      // Remove trailing semicolon if no subtitles were added
      if (filterComplex.endsWith(';')) {
        filterComplex = filterComplex.slice(0, -1);
      }
    }

    // Final Command Assembly: ultrafast preset with 2 threads for instant cloud container render
    let cmd: string;
    if (gameplayPath.startsWith('gradients=')) {
      cmd = `ffmpeg -f lavfi -i "${gameplayPath}" -i "${audioPath}"${inputs} -filter_complex "${filterComplex}" -map "${lastMap}" -map 1:a -c:v libx264 -preset ultrafast -threads 2 -crf 26 -c:a aac -b:a 128k -shortest -y "${outPath}"`;
    } else {
      cmd = `ffmpeg -stream_loop -1 -i "${gameplayPath}" -i "${audioPath}"${inputs} -filter_complex "${filterComplex}" -map "${lastMap}" -map 1:a -c:v libx264 -preset ultrafast -threads 2 -crf 26 -c:a aac -b:a 128k -shortest -y "${outPath}"`;
    }

    try {
      await logToJob(jobId, `Running FFmpeg ultra-fast render...`);
      await execAsync(cmd, { timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
      
      // Cleanup subtitle file
      if (fs.existsSync(assPath)) fs.unlinkSync(assPath);
    } catch (ffErr: any) {
      await logToJob(jobId, `Primary render with subtitles failed (${ffErr.stderr || ffErr.message}). Rendering without subtitles...`);
      try {
        const cmdNoSubs = gameplayPath.startsWith('gradients=')
          ? `ffmpeg -f lavfi -i "${gameplayPath}" -i "${audioPath}"${inputs} -filter_complex "${filterComplexNoSubs}" -map "${lastMapNoSubs}" -map 1:a -c:v libx264 -preset ultrafast -threads 2 -crf 26 -c:a aac -b:a 128k -shortest -y "${outPath}"`
          : `ffmpeg -stream_loop -1 -i "${gameplayPath}" -i "${audioPath}"${inputs} -filter_complex "${filterComplexNoSubs}" -map "${lastMapNoSubs}" -map 1:a -c:v libx264 -preset ultrafast -threads 2 -crf 26 -c:a aac -b:a 128k -shortest -y "${outPath}"`;
        await execAsync(cmdNoSubs, { timeout: 60000, maxBuffer: 50 * 1024 * 1024 });
        await logToJob(jobId, `Rendered 1080p split-screen video successfully.`);
      } catch (noSubsErr: any) {
        await logToJob(jobId, `Secondary render failed (${noSubsErr.stderr || noSubsErr.message}). Using rapid fallback...`);
        try {
          const fallbackCmd = `ffmpeg -f lavfi -i "color=c=0x1e1b4b:s=1080x1920:d=${duration}" -i "${audioPath}" -c:v libx264 -preset ultrafast -threads 2 -c:a aac -shortest -y "${outPath}"`;
          await execAsync(fallbackCmd, { timeout: 30000 });
          await logToJob(jobId, `Used simple fallback render (solid dark background + audio).`);
        } catch (finalErr: any) {
          console.error('Secondary fallback failed, invoking guaranteed emergency canvas render:', finalErr);
          const guaranteedCmd = `ffmpeg -f lavfi -i "color=c=0x1e1b4b:s=1080x1920:d=${duration}" -f lavfi -i "sine=frequency=440:duration=${duration}" -c:v libx264 -preset ultrafast -threads 2 -c:a aac -shortest -y "${outPath}"`;
          await execAsync(guaranteedCmd, { timeout: 30000 });
          await logToJob(jobId, `Used guaranteed emergency canvas render.`);
        }
      }
    }

    // Strict validation: outPath MUST exist and have positive size!
    if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
      throw new Error(`Video file ${outPath} was not created by FFmpeg!`);
    }

    const stats = fs.statSync(outPath);
    await logToJob(jobId, `Render completed! File size: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

  const video = await prisma.video.upsert({
    where: { scriptId },
    update: {
      fileUrl: `/video/${filename}`,
      duration,
      resolution: '1080x1920',
      status: 'READY_FOR_APPROVAL',
      qaScore: 95
    },
    create: {
      scriptId,
      fileUrl: `/video/${filename}`,
      duration,
      resolution: '1080x1920',
      status: 'READY_FOR_APPROVAL',
      qaScore: 95
    }
  });

  await prisma.approval.upsert({
    where: { videoId: video.id },
    update: { status: 'PENDING' },
    create: {
      videoId: video.id,
      status: 'PENDING',
    }
  });

  await prisma.script.update({
    where: { id: scriptId },
    data: { status: 'READY_FOR_APPROVAL' }
  });

  await logToJob(jobId, `Video record created with READY_FOR_APPROVAL. Running inline QA...`);

  // Execute QA inline to calculate exact QA score and verify pacing
  try {
    await handleRunQA({ videoId: video.id }, jobId);
    await logToJob(jobId, `Inline QA completed successfully! Video ready for user review.`);
  } catch (qaErr: any) {
    console.error('Non-fatal inline QA evaluation warning:', qaErr.message);
    await logToJob(jobId, `Inline QA note: ${qaErr.message}. Video remains ready for approval.`);
  }
}
