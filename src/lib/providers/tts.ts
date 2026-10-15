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

// ─── Mock TTS ─────────────────────────────────────────────────────────────────
class MockTTSProvider implements TTSProvider {
  async generateSpeech(text: string, _voiceId?: string) {
    const duration = estimateDuration(text);
    return {
      audioUrl: '/audio/mock.mp3',
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

    // Get EXACT real duration from the file using ffprobe
    let duration = await getRealAudioDuration(filepath);
    if (duration === 0) duration = estimateDuration(text); // fallback

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

    // Get EXACT real duration from the file using ffprobe
    let duration = await getRealAudioDuration(filepath);
    if (duration === 0) duration = estimateDuration(text); // fallback

    return {
      audioUrl: `/audio/${filename}`,
      duration,
      cost: 0 
    };
  }
}

// ─── Fallback Wrapper ─────────────────────────────────────────────────────────
class FallbackTTSProvider implements TTSProvider {
  async generateSpeech(text: string, voiceId?: string) {
    try {
      const primary = new ElevenLabsProvider();
      return await primary.generateSpeech(text, voiceId);
    } catch (e: any) {
      console.warn('[TTS FALLBACK] ElevenLabs error:', e.message);
      try {
        const fallback = new EdgeTTSProvider();
        return await fallback.generateSpeech(text, voiceId);
      } catch (edgeErr: any) {
        console.warn('[TTS FALLBACK] EdgeTTS failed, using mock audio:', edgeErr.message);
        const mock = new MockTTSProvider();
        return await mock.generateSpeech(text, voiceId);
      }
    }
  }
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export async function getTTSProvider(): Promise<TTSProvider> {
  const mode = await getSetting('PROVIDER_MODE');
  if (mode === 'mock') return new MockTTSProvider();
  return new FallbackTTSProvider();
}

