import { prisma } from '@/lib/prisma';
import { Activity } from 'lucide-react';
import { HealthPageClient } from './HealthPageClient';

export const dynamic = 'force-dynamic';

async function runHealthChecks() {
  const checks = [];

  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    const jobCount = await prisma.job.count();
    checks.push({ name: 'Database (SQLite)', status: 'GREEN' as const, detail: `${jobCount} jobs in queue` });
  } catch (e: any) {
    checks.push({ name: 'Database (SQLite)', status: 'RED' as const, detail: e.message });
  }

  // LLM Providers
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  checks.push({
    name: 'LLM Provider',
    status: (hasOpenAI || hasGemini) ? 'GREEN' as const : 'YELLOW' as const,
    detail: hasGemini ? 'Gemini configured' : hasOpenAI ? 'OpenAI configured' : 'No LLM key set — running in mock mode'
  });

  // TTS
  const hasTTS = !!process.env.ELEVENLABS_API_KEY;
  checks.push({
    name: 'ElevenLabs TTS',
    status: hasTTS ? 'GREEN' as const : 'YELLOW' as const,
    detail: hasTTS ? 'API key present' : 'Not configured — mock TTS active'
  });

  // YouTube
  try {
    const ytCred = await prisma.oAuthCredential.findFirst({ where: { provider: 'youtube' } });
    const hasYTClientId = !!process.env.YOUTUBE_CLIENT_ID;
    checks.push({
      name: 'YouTube',
      status: ytCred?.refreshToken ? 'GREEN' as const : (hasYTClientId ? 'YELLOW' as const : 'RED' as const),
      detail: ytCred?.refreshToken ? 'OAuth token active' : 'Channel not connected'
    });
  } catch (e: any) {
    checks.push({ name: 'YouTube', status: 'RED' as const, detail: e.message });
  }

  // Instagram
  try {
    const igCred = await prisma.oAuthCredential.findFirst({ where: { provider: 'instagram' } });
    checks.push({
      name: 'Instagram / Meta',
      status: igCred?.accessToken ? 'GREEN' as const : 'YELLOW' as const,
      detail: igCred?.accessToken ? 'Token active' : 'Not connected'
    });
  } catch (e: any) {
    checks.push({ name: 'Instagram / Meta', status: 'RED' as const, detail: e.message });
  }

  // Telegram
  const hasTelegram = !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID);
  checks.push({
    name: 'Telegram Bot',
    status: hasTelegram ? 'GREEN' as const : 'YELLOW' as const,
    detail: hasTelegram ? 'Bot token configured' : 'Not configured — notifications disabled'
  });

  // Worker queue
  try {
    const pendingJobs = await prisma.job.count({ where: { status: 'PENDING' } });
    const processingJobs = await prisma.job.count({ where: { status: 'PROCESSING' } });
    const stuckJobs = await prisma.job.count({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: new Date(Date.now() - 10 * 60 * 1000) } // older than 10 min
      }
    });
    checks.push({
      name: 'Job Queue',
      status: stuckJobs > 0 ? 'YELLOW' as const : 'GREEN' as const,
      detail: `${pendingJobs} pending, ${processingJobs} processing${stuckJobs > 0 ? `, ⚠️ ${stuckJobs} possibly stuck` : ''}`
    });
  } catch (e: any) {
    checks.push({ name: 'Job Queue', status: 'RED' as const, detail: e.message });
  }

  // Remotion / FFmpeg (check if binary exists)
  try {
    const fs = await import('fs');
    const path = await import('path');
    const publicDir = path.join(process.cwd(), 'public', 'video');
    const dirExists = fs.existsSync(publicDir);
    checks.push({
      name: 'Video Storage',
      status: dirExists ? 'GREEN' as const : 'YELLOW' as const,
      detail: dirExists ? 'public/video/ directory exists' : 'public/video/ not found — will be created on first render'
    });
  } catch (e: any) {
    checks.push({ name: 'Video Storage', status: 'RED' as const, detail: e.message });
  }

  return checks;
}

export default async function HealthPage() {
  const checks = await runHealthChecks();
  const greenCount = checks.filter(c => c.status === 'GREEN').length;
  const yellowCount = checks.filter(c => c.status === 'YELLOW').length;
  const redCount = checks.filter(c => c.status === 'RED').length;

  const overallStatus = redCount > 0 ? 'RED' : yellowCount > 2 ? 'YELLOW' : 'GREEN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={22} color="#3b82f6" />
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: 0 }}>
              System Health
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
              {greenCount} healthy · {yellowCount} warnings · {redCount} critical
            </p>
          </div>
        </div>
        <div style={{
          padding: '8px 16px', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
          background: overallStatus === 'GREEN' ? 'rgba(16,185,129,0.1)' : overallStatus === 'YELLOW' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
          color: overallStatus === 'GREEN' ? '#34d399' : overallStatus === 'YELLOW' ? '#fbbf24' : '#f87171',
          border: `1px solid ${overallStatus === 'GREEN' ? 'rgba(16,185,129,0.2)' : overallStatus === 'YELLOW' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)'}`
        }}>
          SYSTEM {overallStatus}
        </div>
      </div>

      <HealthPageClient checks={checks} />
    </div>
  );
}
