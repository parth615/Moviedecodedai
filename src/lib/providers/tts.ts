import { getSetting } from '../settings';
import fs from 'fs';
import path from 'path';
import { EdgeTTS } from 'node-edge-tts';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export interface TTSProvider {
  generateSpeech(text: string, voiceId?: string): Promise<{ audioUrl: string; duration: number; cost: number }>;
}

// Estimate speaking duration from word count (fallback)
function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(5, Math.round((words / 150) * 60));
}

// Get exact real duration of an audio file using ffprobe
async function getRealAudioDuration(filepath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filepath}"`);
    const duration = parseFloat(stdout.trim());
    return isNaN(duration) ? 0 : duration;
  } catch (e) {
    console.error('Failed to get real audio duration with ffprobe:', e);
    return 0;
  }
}

// ─── Free Google Translate Neural Speech (High-Reliability Fallback) ─────────────
class GoogleTTSProvider implements TTSProvider {
  async generateSpeech(text: string, _voiceId?: string) {
    const filename = `voice_google_${Date.now()}.mp3`;
    const filepath = path.join(process.cwd(), 'public', 'audio', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    // Split text into readable chunks <= 180 chars for the Google TTS endpoint
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const chunks: string[] = [];

    for (const s of sentences) {
      if (!s.trim()) continue;
      if (s.length > 180) {
        const words = s.split(' ');
        let cur = '';
        for (const w of words) {
          if ((cur + ' ' + w).length > 180) {
            chunks.push(cur.trim());
            cur = w;
          } else {
            cur += ' ' + w;
          }
        }
        if (cur.trim()) chunks.push(cur.trim());
      } else {
        chunks.push(s.trim());
      }
    }

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=en&client=tw-ob`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      if (res.ok) {
        const buf = await res.arrayBuffer();
        buffers.push(Buffer.from(buf));
      }
    }

    if (buffers.length === 0) {
      throw new Error('Google TTS returned no audio data');
    }

    const combined = Buffer.concat(buffers);
    fs.writeFileSync(filepath, combined);

    let duration = await getRealAudioDuration(filepath);
    if (duration === 0) duration = estimateDuration(text);

    return {
      audioUrl: `/audio/${filename}`,
      duration,
      cost: 0
    };
  }
}

// ─── ElevenLabs TTS ───────────────────────────────────────────────────────────
class ElevenLabsProvider implements TTSProvider {
  async generateSpeech(text: string, voiceId?: string) {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY');

    const vId = voiceId || process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';
    const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs API Error: ${response.status} - ${errText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const filename = `voice_${Date.now()}.mp3`;
    const filepath = path.join(process.cwd(), 'public', 'audio', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });
    fs.writeFileSync(filepath, Buffer.from(audioBuffer));

    let duration = await getRealAudioDuration(filepath);
    if (duration === 0) duration = estimateDuration(text);

    const cost = (text.length / 1000) * 0.30;

    return {
      audioUrl: `/audio/${filename}`,
      duration,
      cost
    };
  }
}

// ─── Free Edge TTS (Microsoft Neural) ─────────────────────────────────────────
class EdgeTTSProvider implements TTSProvider {
  async generateSpeech(text: string, _voiceId?: string) {
    const tts = new EdgeTTS({
      voice: 'en-US-ChristopherNeural'
    });

    const filename = `voice_edge_${Date.now()}.mp3`;
    const filepath = path.join(process.cwd(), 'public', 'audio', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    await tts.ttsPromise(text, filepath);

    let duration = await getRealAudioDuration(filepath);
    if (duration === 0) duration = estimateDuration(text);

    return {
      audioUrl: `/audio/${filename}`,
      duration,
      cost: 0 
    };
  }
}

// ─── Guaranteed Mock TTS (Physical file synthesis) ───────────────────────────
class MockTTSProvider implements TTSProvider {
  async generateSpeech(text: string, _voiceId?: string) {
    const duration = estimateDuration(text);
    const filename = 'mock.mp3';
    const filepath = path.join(process.cwd(), 'public', 'audio', filename);
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    // Ensure mock.mp3 physically exists on disk so FFmpeg NEVER chokes
    if (!fs.existsSync(filepath) || fs.statSync(filepath).size === 0) {
      try {
        await execAsync(`ffmpeg -f lavfi -i "sine=frequency=440:duration=${duration}" -c:a libmp3lame -b:a 128k -y "${filepath}"`);
      } catch (_) {
        // Safe minimal fallback
        fs.writeFileSync(filepath, Buffer.alloc(1024));
      }
    }

    return {
      audioUrl: `/audio/${filename}`,
      duration,
      cost: 0
    };
  }
}

// ─── Universal Fallback Wrapper ─────────────────────────────────────────────
class FallbackTTSProvider implements TTSProvider {
  async generateSpeech(text: string, voiceId?: string) {
    // 1. Microsoft Edge Neural Speech (Ultra-realistic, studio-grade human narrator, 100% Free)
    try {
      const edge = new EdgeTTSProvider();
      return await edge.generateSpeech(text, voiceId);
    } catch (edgeErr: any) {
      console.warn('[TTS] EdgeTTS failed, falling back:', edgeErr.message);
    }

    // 2. ElevenLabs (if user provided valid key)
    if (process.env.ELEVENLABS_API_KEY && !process.env.ELEVENLABS_API_KEY.includes('mock')) {
      try {
        const primary = new ElevenLabsProvider();
        return await primary.generateSpeech(text, voiceId);
      } catch (e: any) {
        console.warn('[TTS] ElevenLabs error:', e.message);
      }
    }

    // 3. Google Speech fallback
    try {
      const google = new GoogleTTSProvider();
      return await google.generateSpeech(text, voiceId);
    } catch (gErr: any) {
      console.warn('[TTS] Google TTS error:', gErr.message);
    }

    // 4. Physical Mock Audio file (synthesized tone with real duration)
    const mock = new MockTTSProvider();
    return await mock.generateSpeech(text, voiceId);
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export async function getTTSProvider(): Promise<TTSProvider> {
  const mode = await getSetting('PROVIDER_MODE');
  if (mode === 'mock') return new MockTTSProvider();
  return new FallbackTTSProvider();
}
