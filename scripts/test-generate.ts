import { generateStructuredLLM } from '../src/lib/providers/llm';
import { z } from 'zod';

async function main() {
  try {
    await generateStructuredLLM('system', 'user', z.object({ msg: z.string() }), 'test');
  } catch (e: any) {
    console.error('Error caught:', e.message);
  }
}

main().catch(console.error);
