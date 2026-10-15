import { prisma } from '../src/lib/prisma';

async function main() {
  const setting = await prisma.setting.upsert({
    where: { key: 'DEFAULT_LANGUAGE' },
    update: { value: 'english' },
    create: { key: 'DEFAULT_LANGUAGE', value: 'english', description: 'Default Generation Language' }
  });
  console.log('Set DEFAULT_LANGUAGE to', setting.value);
}

main().catch(console.error).finally(() => process.exit(0));
