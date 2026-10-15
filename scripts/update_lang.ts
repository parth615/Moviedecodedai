import { prisma } from '../src/lib/prisma';

async function main() {
  await prisma.topic.updateMany({
    where: { language: 'hinglish' },
    data: { language: 'english' }
  });
  await prisma.script.updateMany({
    where: { language: 'hinglish' },
    data: { language: 'english' }
  });
  console.log('Updated all existing topics and scripts to English.');
}

main().catch(console.error).finally(() => process.exit(0));
