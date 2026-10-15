import { EdgeTTS } from 'node-edge-tts';
import fs from 'fs';

async function test() {
  try {
    const tts = new EdgeTTS({
      voice: 'en-US-ChristopherNeural' // Good deep masculine voice
    });
    await tts.ttsPromise('Hello! This is a test of the absolutely free Microsoft Edge Neural TTS system!', 'test-edge.mp3');
    console.log('Success! Saved to test-edge.mp3');
    console.log('File size:', fs.statSync('test-edge.mp3').size);
  } catch (e: any) {
    console.error('Failed:', e);
  }
}

test();
