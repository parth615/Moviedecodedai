const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.job.create({data: {name: 'GENERATE_TOPICS'}})
  .then(()=>console.log('Enqueued GENERATE_TOPICS job'))
  .finally(()=>prisma.$disconnect());
