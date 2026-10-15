import { prisma } from '@/lib/prisma';
import { Video as Youtube, Camera as Instagram, CheckCircle2, AlertCircle, Link, Unlink } from 'lucide-react';
import { disconnectIntegration } from './actions';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const credentials = await prisma.oAuthCredential.findMany();
  
  const youtube = credentials.find(c => c.provider === 'youtube');
  const instagram = credentials.find(c => c.provider === 'instagram');

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Link className="w-6 h-6 text-blue-500" />
          Production Integrations
        </h1>
        <p className="text-sm text-slate-400 mt-1">Connect your real YouTube and Instagram accounts securely via OAuth.</p>
      </div>

      {searchParams.success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Successfully connected {searchParams.success}!</p>
        </div>
      )}

      {searchParams.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium">Connection failed: {searchParams.error}</p>
        </div>
      )}

      <div className="grid gap-6">
        {/* YOUTUBE */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <Youtube className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">YouTube Shorts</h3>
              {youtube ? (
                <div className="flex flex-col mt-1">
                  <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Connected</span>
                  <span className="text-xs text-slate-500 mt-1">Account: {youtube.accountInfo ? JSON.parse(youtube.accountInfo).name : 'Unknown'}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-1">Not connected</p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {youtube ? (
              <form action={disconnectIntegration.bind(null, 'youtube')}>
                <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </button>
              </form>
            ) : (
              <a href="/api/auth/youtube/connect" className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <Link className="w-4 h-4" />
                Connect YouTube
              </a>
            )}
          </div>
        </div>

        {/* INSTAGRAM */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
              <Instagram className="w-6 h-6 text-pink-500" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">Instagram Reels</h3>
              {instagram ? (
                <div className="flex flex-col mt-1">
                  <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Connected</span>
                  <span className="text-xs text-slate-500 mt-1">Account: {instagram.accountInfo ? JSON.parse(instagram.accountInfo).name : 'Unknown'}</span>
                </div>
              ) : (
                <p className="text-sm text-slate-400 mt-1">Not connected. Requires Meta Business App.</p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0">
            {instagram ? (
              <form action={disconnectIntegration.bind(null, 'instagram')}>
                <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                  <Unlink className="w-4 h-4" />
                  Disconnect
                </button>
              </form>
            ) : (
              <a href="/api/auth/instagram/connect" className="px-4 py-2 bg-pink-600 hover:bg-pink-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
                <Link className="w-4 h-4" />
                Connect Instagram
              </a>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
