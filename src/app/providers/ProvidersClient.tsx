'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, Key, Image as ImageIcon, MessageCircle, Share2, Video, Database } from 'lucide-react';

export function ProvidersClient({ initialProviders }: { initialProviders: any }) {
  const [providers, setProviders] = useState(initialProviders);

  const StatusBadge = ({ active }: { active: boolean }) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '12px',
      background: active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
      color: active ? '#10b981' : '#ef4444',
      border: `1px solid ${active ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
    }}>
      {active ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
      {active ? 'CONNECTED' : 'DISCONNECTED'}
    </span>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* LLM Providers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="text-purple-400" size={18} />
          <h2 className="text-lg font-bold text-white">Language Models</h2>
        </div>
        <p className="text-sm text-slate-400 mb-4">
          Current Engine Mode: <span className="text-purple-400 font-mono font-bold uppercase">{providers.llm.activeMode}</span>
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm font-medium text-slate-200">{providers.llm.gemini.label}</span>
            <StatusBadge active={providers.llm.gemini.active} />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm font-medium text-slate-200">{providers.llm.openai.label}</span>
            <StatusBadge active={providers.llm.openai.active} />
          </div>
        </div>
      </div>

      {/* TTS Providers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="text-emerald-400" size={18} />
          <h2 className="text-lg font-bold text-white">Voice / TTS</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm font-medium text-slate-200">{providers.tts.elevenlabs.label}</span>
            <StatusBadge active={providers.tts.elevenlabs.active} />
          </div>
        </div>
      </div>

      {/* Social Providers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="text-pink-400" size={18} />
          <h2 className="text-lg font-bold text-white">Social Publishing</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-200">{providers.social.youtube.label}</p>
              {providers.social.youtube.account && (
                <p className="text-xs text-slate-500 mt-0.5">{JSON.parse(providers.social.youtube.account).name || JSON.parse(providers.social.youtube.account).email}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge active={providers.social.youtube.active} />
              <a href="/api/auth/youtube" className="text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                {providers.social.youtube.active ? 'Reconnect' : 'Connect'}
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
             <div>
              <p className="text-sm font-medium text-slate-200">{providers.social.instagram.label}</p>
              {providers.social.instagram.account && (
                <p className="text-xs text-slate-500 mt-0.5">{JSON.parse(providers.social.instagram.account).name}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge active={providers.social.instagram.active} />
              {!providers.social.instagram.active && (
                <a href="/api/auth/instagram" className="text-xs font-medium bg-pink-600 hover:bg-pink-500 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Connect
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="text-blue-400" size={18} />
          <h2 className="text-lg font-bold text-white">Notifications</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <span className="text-sm font-medium text-slate-200">{providers.notifications.telegram.label}</span>
            <StatusBadge active={providers.notifications.telegram.active} />
          </div>
        </div>
      </div>

    </div>
  );
}
