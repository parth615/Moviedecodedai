import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { approveVideo, rejectVideo, regenerateVideo, updateVideoSettings, resetVideoToReady } from './actions';
import { Check, X, RefreshCw, Edit, Mic, Image as ImageIcon, Settings2, Subtitles, AlertCircle, AlertTriangle, ExternalLink, Download } from 'lucide-react';
import { VideoPreview } from './VideoPreview';

export const dynamic = 'force-dynamic';

export default async function ApprovalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  const pendingVideos = await prisma.video.findMany({
    where: { 
      script: { topic: { userId } }, 
      status: { in: ['READY_FOR_APPROVAL', 'COMPLETED', 'APPROVED'] }
    },
    include: {
      script: {
        include: { topic: true, gameplayAsset: true, voiceAsset: true, visualAssets: true }
      },
      approval: true,
      publications: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const gameplayAssets = await prisma.gameplayAsset.findMany({
    orderBy: { title: 'asc' }
  });

  if (pendingVideos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <Check className="w-16 h-16 text-slate-700" />
        <h2 className="text-xl text-slate-400">No videos pending approval.</h2>
        <p className="text-sm text-slate-500">Run the worker to populate the queue.</p>
      </div>
    );
  }

  const video = pendingVideos[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Review & Approve</h1>
        <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/20">
          {pendingVideos.length} Pending
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {/* Actual Rendered Video Preview with forced volume */}
          <VideoPreview url={video.fileUrl} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {video.status === 'APPROVED' && (
            <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-4 flex items-center justify-between text-blue-200">
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-sm font-semibold">Publishing Video in Background</p>
                  <p className="text-xs text-blue-300/80">Worker is uploading to YouTube Shorts & Instagram Reels. Please wait a moment.</p>
                </div>
              </div>
              <form action={resetVideoToReady.bind(null, video.id)}>
                <button type="submit" className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700">
                  Reset
                </button>
              </form>
            </div>
          )}

          {video.approval?.feedback && (
            <div className="bg-amber-950/40 border border-amber-500/50 rounded-xl p-5 text-amber-200 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-amber-300">Publishing Notice from YouTube</h4>
                  <p className="text-xs text-amber-200/90 leading-relaxed font-mono bg-black/40 p-2.5 rounded-lg border border-amber-500/20">
                    {video.approval.feedback}
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-4 rounded-lg border border-slate-800 space-y-2">
                <p className="font-semibold text-white">Why did this happen?</p>
                <p className="text-slate-400 leading-relaxed">
                  YouTube limits automated API uploads on channels without phone verification, or if your channel reached its daily video limit (usually 1–5 videos/day for new accounts).
                </p>
                <p className="font-semibold text-white pt-1">What you can do right now:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={video.fileUrl}
                    download="MovieDecoded_Short.mp4"
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition"
                  >
                    <Download className="w-4 h-4" /> Download MP4 (Upload Now)
                  </a>
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" /> YouTube Studio Settings
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-white mb-2">{video.script.topic.title}</h2>
            <div className="flex gap-4 text-sm mb-6">
              <span className="text-slate-400">Category: <span className="text-slate-200">{video.script.topic.category}</span></span>
              <span className="text-slate-400">QA Score: <span className={video.qaScore && video.qaScore >= 80 ? "text-green-400 font-bold" : "text-amber-400 font-bold"}>{video.qaScore}/100</span></span>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-2">Script Hook</h3>
                <p className="text-slate-300 italic">"{video.script.hook}"</p>
              </div>
            </div>
          </div>

          {/* ADVANCED SETTINGS */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-400" /> Advanced Settings
            </h3>
            
            <form action={updateVideoSettings} className="space-y-4">
              <input type="hidden" name="videoId" value={video.id} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Template</label>
                  <select name="templateId" defaultValue={video.script.templateId} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="GameplayFactsTemplate">Full-Screen Gameplay (Viral Facts)</option>
                    <option value="SplitScreenTemplate">Split-Screen (Gameplay)</option>
                    <option value="TemplateA">Template A (Cinematic)</option>
                    <option value="TemplateB">Template B (Documentary)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Gameplay Asset</label>
                  <select name="gameplayAssetId" defaultValue={video.script.gameplayAssetId || ''} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    <option value="">None / Default</option>
                    {gameplayAssets.map(asset => (
                      <option key={asset.id} value={asset.id}>{asset.title} ({asset.duration}s)</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1 flex justify-between">
                  <span>Animation Intensity</span>
                  <span>{video.script.animationIntensity}x</span>
                </label>
                <input type="range" name="animationIntensity" min="0.5" max="2.0" step="0.1" defaultValue={video.script.animationIntensity} className="w-full accent-indigo-500" />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
                <button type="submit" name="submitAction" value="REGENERATE_RENDER" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm">
                  <RefreshCw className="w-4 h-4" /> Apply & Re-Render
                </button>
                <button type="submit" name="submitAction" value="REGENERATE_CAPTIONS" className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm border border-slate-700">
                  <Subtitles className="w-4 h-4" /> Regenerate Captions
                </button>
              </div>
            </form>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
             <form action={regenerateVideo.bind(null, video.id, 'FULL')}>
              <button type="submit" className="w-full flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-lg text-xs font-medium transition-colors">
                <RefreshCw className="w-4 h-4" /> REGENERATE SCRIPT
              </button>
            </form>
            <form action={regenerateVideo.bind(null, video.id, 'VOICE')}>
              <button type="submit" className="w-full flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-lg text-xs font-medium transition-colors">
                <Mic className="w-4 h-4" /> NEW VOICE
              </button>
            </form>
            <form action={regenerateVideo.bind(null, video.id, 'VISUALS')}>
              <button type="submit" className="w-full flex flex-col items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 py-3 rounded-lg text-xs font-medium transition-colors">
                <ImageIcon className="w-4 h-4" /> NEW VISUALS
              </button>
            </form>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {video.status === 'APPROVED' ? (
              <button disabled className="w-full flex items-center justify-center gap-2 bg-slate-800 text-slate-400 font-semibold py-4 rounded-xl cursor-not-allowed border border-slate-700">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-400" /> PUBLISHING IN PROGRESS...
              </button>
            ) : (
              <form action={approveVideo.bind(null, video.id)}>
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-900/20">
                  <Check className="w-5 h-5" /> PUBLISH VIDEO
                </button>
              </form>
            )}
            <form action={rejectVideo.bind(null, video.id)}>
              <button type="submit" className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 border border-slate-700 hover:border-red-500/50 text-slate-300 font-semibold py-4 rounded-xl transition-colors">
                <X className="w-5 h-5" /> REJECT
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
