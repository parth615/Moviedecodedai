import { prisma } from './prisma';

export type JobName = 
  | 'GENERATE_TOPICS'
  | 'RESEARCH_TOPIC' 
  | 'GENERATE_SCRIPT' 
  | 'FACT_CHECK' 
  | 'GENERATE_VOICE' 
  | 'GENERATE_SUBTITLES'
  | 'GENERATE_VISUALS' 
  | 'RENDER_VIDEO' 
  | 'RUN_QA'
  | 'NOTIFY_TELEGRAM'
  | 'PUBLISH_VIDEO'
  | 'FETCH_ANALYTICS';

export async function enqueueJob(name: JobName, data: any = {}) {
  return await prisma.job.create({
    data: {
      name,
      data: JSON.stringify(data),
      status: 'PENDING',
    }
  });
}

export async function getNextJob() {
  // Find a pending job
  const job = await prisma.job.findFirst({
    where: { 
      status: 'PENDING'
    },
    orderBy: { createdAt: 'asc' }
  });

  if (!job) return null;

  // Mark as processing
  return await prisma.job.update({
    where: { id: job.id },
    data: { 
      status: 'PROCESSING',
      attemptCount: { increment: 1 }
    }
  });
}

export async function markJobFailed(id: string, error: Error) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return;

  const newStatus = job.attemptCount >= 3 ? 'FAILED' : 'PENDING';
  
  await prisma.job.update({
    where: { id },
    data: { 
      status: newStatus,
      error: error.message,
      logs: (job.logs || '') + `\n[ERROR]: ${error.message}\n${error.stack}`
    }
  });
}

export async function markJobCompleted(id: string) {
  await prisma.job.update({
    where: { id },
    data: { 
      status: 'COMPLETED',
      error: null
    }
  });
}

export async function logToJob(id: string, message: string) {
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job) return;

  await prisma.job.update({
    where: { id },
    data: { 
      logs: (job.logs || '') + `\n[${new Date().toISOString()}] ${message}`
    }
  });
}
