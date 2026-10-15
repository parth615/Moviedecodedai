import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { ProvidersClient } from './ProvidersClient';
import { Server } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProvidersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  const settings = await prisma.setting.findMany();
  
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY;
  const hasTelegram = !!process.env.TELEGRAM_BOT_TOKEN;

  const ytCred = await prisma.oAuthCredential.findUnique({ where: { userId_provider: { userId, provider: 'youtube' } } });
  const igCred = await prisma.oAuthCredential.findUnique({ where: { userId_provider: { userId, provider: 'instagram' } } });

  const providers = {
    llm: {
      gemini: { active: hasGemini, label: 'Gemini (Google)' },
      openai: { active: hasOpenAI, label: 'OpenAI (ChatGPT)' },
      activeMode: settings.find(s => s.key === 'PROVIDER_MODE')?.value || 'mock'
    },
    tts: {
      elevenlabs: { active: hasElevenLabs, label: 'ElevenLabs' }
    },
    social: {
      youtube: { active: !!ytCred?.refreshToken, label: 'YouTube Shorts', account: ytCred?.accountInfo || null },
      instagram: { active: !!igCred?.accessToken, label: 'Instagram Reels', account: igCred?.accountInfo || null }
    },
    notifications: {
      telegram: { active: hasTelegram, label: 'Telegram Bot' }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/20 rounded-lg">
          <Server className="text-blue-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">AI & Social Providers</h1>
          <p className="text-sm text-slate-400">Manage connections to external AI models and social platforms.</p>
        </div>
      </div>

      <ProvidersClient initialProviders={providers} />
    </div>
  );
}
