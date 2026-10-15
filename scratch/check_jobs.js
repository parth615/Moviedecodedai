const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(jobs.map(j => ({name: j.name, status: j.status, error: j.error, logs: j.logs?.slice(-100)})), null, 2));
}

run().finally(() => prisma.$disconnect());
