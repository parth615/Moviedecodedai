import { prisma } from '../src/lib/prisma';

async function main() {
  const setting = await prisma.setting.upsert({
    where: { key: 'DEFAULT_LLM_PROVIDER' },
    update: { value: 'auto' },
    create: { key: 'DEFAULT_LLM_PROVIDER', value: 'auto', description: 'Default LLM Provider (auto/gemini/openai)' }
  });
  console.log('Set DEFAULT_LLM_PROVIDER to', setting.value);
}

main().catch(console.error).finally(() => process.exit(0));
