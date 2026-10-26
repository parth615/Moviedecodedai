import { prisma } from './prisma';

// Widened to string so new keys don't break TypeScript
export const DEFAULT_SETTINGS: Record<string, string> = {
  PROVIDER_MODE: 'production',
  DAILY_VIDEO_LIMIT: '50',
  DAILY_BUDGET: '10.00',
  MINIMUM_QA_SCORE: '80',
  MINIMUM_RESEARCH_CONFIDENCE: '75',
  DEFAULT_LANGUAGE: 'english',
  DEFAULT_COUNTRY: 'IN',
  DEFAULT_VOICE: 'pNInz6obpgDQGcFmaJgB',
  DEFAULT_TEMPLATE: 'GameplayFactsTemplate',
  DEFAULT_LLM_PROVIDER: 'auto', // 'auto' | 'openai' | 'gemini' | 'mock'
  POSTING_SCHEDULE: '12:30,15:30,18:30,20:30,22:30',
  AUTOMATION_PAUSED: 'false',
  CONTENT_STYLE: 'FAST_PACED',
  AUDIO_VOICE_VOLUME: '1.0',
  AUDIO_MUSIC_VOLUME: '0.3',
  AUDIO_DUCK_MUSIC: 'true',
  GEMINI_API_KEY: '',
  AUTO_PUBLISH: 'false',
  AUTOPILOT_STATUS: 'idle', // 'idle' | 'active' | 'paused'
  AUTOPILOT_USER_ID: '',
  AUTOPILOT_REMAINING: '0',
  AUTOPILOT_TOTAL: '0',
  // Content category weights (must sum to 10)
  CONTENT_MIX: JSON.stringify({
    trending: 3,
    facts: 2,
    entertainment: 2,
    psychology: 1,
    business: 1,
    experimental: 1
  })
};

export async function getSetting(key: string): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (setting) return setting.value;
  return DEFAULT_SETTINGS[key] ?? '';
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value }
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const s of settings) {
    result[s.key] = s.value;
  }
  return result;
}
