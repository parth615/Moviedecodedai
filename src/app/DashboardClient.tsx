'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  PauseCircle, 
  Zap, 
  Coins, 
  Sparkles,
  Gift,
  Check,
  Radio,
  Bot,
  Rocket,
  RefreshCw,
  Power
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { UpiPaymentModal } from '@/components/UpiPaymentModal';
import { RedeemTokenModal } from '@/components/RedeemTokenModal';

const PIPELINE_STEPS = [
  { label: 'Ideas', icon: '💡', desc: 'Viral Topic AI' },
  { label: 'Research', icon: '🔍', desc: 'Fact Mining' },
  { label: 'Scripts', icon: '📝', desc: 'Hook & Script' },
  { label: 'Voice', icon: '🎙️', desc: 'ElevenLabs Audio' },
  { label: 'Visuals', icon: '🎬', desc: 'Scene Imagery' },
  { label: 'Render', icon: '🖥️', desc: 'FFmpeg 1080p' },
  { label: 'QA', icon: '✅', desc: 'Quality Check' },
  { label: 'Approval', icon: '👤', desc: 'Creator Review' },
  { label: 'Published', icon: '🚀', desc: 'YouTube Live' },
];

export function DashboardClient({ stats, isPaused }: {
  stats: {
    generated: string;
    pendingApproval: number;
    approved: number;
    published: number;
  };
  isPaused: boolean;
}) {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [credits, setCredits] = useState<number>(0);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [initialRedeemToken, setInitialRedeemToken] = useState('');
  const [livePendingApproval, setLivePendingApproval] = useState(stats.pendingApproval);

  // Live Pipeline Progress State
  const [pipelineStatus, setPipelineStatus] = useState<{
    activeStageIndex: number;
    activeStageLabel: string;
    completedStages: number[];
    isProcessing: boolean;
    detailedMessage: string;
    progressPercent: number;
    topicTitle: string;
    videoId: string;
    videoUrl: string;
  }>({
    activeStageIndex: -1,
    activeStageLabel: 'Pipeline Idle',
    completedStages: [],
    isProcessing: false,
    detailedMessage: '',
    progressPercent: 0,
    topicTitle: '',
    videoId: '',
    videoUrl: '',
  });

  // Auto-Pilot Autonomous Engine State
  const [autopilotState, setAutopilotState] = useState<{
    status: 'idle' | 'active' | 'paused';
    remaining: number;
    total: number;
    autoPublish: boolean;
  }>({
    status: 'idle',
    remaining: 0,
    total: 0,
    autoPublish: false,
  });
  const [autopilotMode, setAutopilotMode] = useState<'8' | 'unlimited' | 'custom'>('8');
  const [customBatchCount, setCustomBatchCount] = useState<number>(8);
  const [isStartingAutopilot, setIsStartingAutopilot] = useState(false);

  // Check URL query param for ?token= or ?redeem=
  useEffect(() => {
    const queryToken = searchParams?.get('token') || searchParams?.get('redeem');
    if (queryToken) {
      setInitialRedeemToken(queryToken);
      setIsRedeemModalOpen(true);
    }
  }, [searchParams]);

  // Fetch live credits
  const fetchCredits = () => {
    fetch('/api/user/credits')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.credits === 'number') {
          setCredits(data.credits);
        }
      })
      .catch(() => {});
  };

  // Fetch live pipeline status
  const fetchPipelineStatus = async () => {
    try {
      const res = await fetch('/api/pipeline/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPipelineStatus(data);
          if (data.isProcessing) {
            setIsGenerating(true);
          } else {
            setIsGenerating(false);
          }
          if (data.activeStageIndex === 7) {
            setLivePendingApproval((prev) => Math.max(prev, 1));
          }
        }
      }
    } catch (_) {}
  };

  // Fetch live Auto-Pilot state
  const fetchAutopilotStatus = async () => {
    try {
      const res = await fetch('/api/pipeline/autopilot');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAutopilotState({
            status: data.status,
            remaining: data.remaining,
            total: data.total,
            autoPublish: data.autoPublish,
          });
        }
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchCredits();
    fetchPipelineStatus();
    fetchAutopilotStatus();
    // Poll every 3 seconds to track real-time job progress across stages and autopilot
    const interval = setInterval(() => {
      fetchPipelineStatus();
      fetchAutopilotStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartAutopilot = async () => {
    setIsStartingAutopilot(true);
    setMessage('');
    try {
      const isUnlimited = autopilotMode === 'unlimited';
      const count = isUnlimited ? -1 : autopilotMode === '8' ? 8 : customBatchCount;
      const res = await fetch('/api/pipeline/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', mode: isUnlimited ? 'unlimited' : 'count', count })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage(`🚀 Auto-Pilot initiated! System will autonomously generate, render, and publish ${isUnlimited ? 'until credits run out' : `${count} videos`} straight to YouTube Shorts.`);
        setMessageType('success');
        setCredits((prev) => Math.max(0, prev - 1));
        fetchAutopilotStatus();
        fetchPipelineStatus();
      } else {
        setMessage(`✗ ${data.error || 'Failed to start Auto-Pilot.'}`);
        setMessageType('error');
      }
    } catch (e: any) {
      setMessage(`✗ ${e.message}`);
      setMessageType('error');
    } finally {
      setIsStartingAutopilot(false);
      setTimeout(() => setMessage(''), 7000);
    }
  };

  const handleStopAutopilot = async () => {
    try {
      await fetch('/api/pipeline/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });
      setMessage('✓ Auto-Pilot stopped. Any video currently rendering will finish cleanly.');
      setMessageType('success');
      fetchAutopilotStatus();
    } catch (_) {}
  };

  const handleToggleAutoPublish = async (enabled: boolean) => {
    try {
      await fetch('/api/pipeline/autopilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_auto_publish', autoPublish: enabled })
      });
      setAutopilotState((prev) => ({ ...prev, autoPublish: enabled }));
      setMessage(enabled ? '✓ Auto-Publish enabled: Videos will upload to YouTube Shorts automatically on QA pass.' : '✓ Manual Approval required: Videos will wait for your review.');
      setMessageType('success');
      setTimeout(() => setMessage(''), 5000);
    } catch (_) {}
  };

  const executeGenerate = async () => {
    setIsGenerating(true);
    setMessage('');

    // Instantly light up stage 0 ("Ideas") so the user sees immediate visual feedback
    setPipelineStatus((prev) => ({
      ...prev,
      activeStageIndex: 0,
      activeStageLabel: 'Generating Viral Ideas',
      detailedMessage: 'Gemini AI is researching viral hooks & trending angles...',
      isProcessing: true,
      progressPercent: 12,
    }));

    try {
      const res = await fetch('/api/pipeline/generate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('✓ Video pipeline initiated! Watch the stages glow as your video is generated.');
        setMessageType('success');
        setCredits((prev) => Math.max(0, prev - 1));
        // Immediately fetch updated status
        setTimeout(fetchPipelineStatus, 1000);
      } else if (res.status === 402 || data.error?.includes('credit')) {
        setIsUpiModalOpen(true);
        setIsGenerating(false);
        setPipelineStatus((prev) => ({ ...prev, activeStageIndex: -1, isProcessing: false }));
      } else {
        setMessage(`✗ ${data.error || 'Failed to start pipeline.'}`);
        setMessageType('error');
        setIsGenerating(false);
        setPipelineStatus((prev) => ({ ...prev, activeStageIndex: -1, isProcessing: false }));
      }
    } catch (e: any) {
      setMessage(`✗ ${e.message}`);
      setMessageType('error');
      setIsGenerating(false);
      setPipelineStatus((prev) => ({ ...prev, activeStageIndex: -1, isProcessing: false }));
    } finally {
      setTimeout(() => setMessage(''), 7000);
    }
  };

  const handleResetPipeline = async () => {
    try {
      await fetch('/api/pipeline/reset', { method: 'POST' });
      setIsGenerating(false);
      setPipelineStatus((prev) => ({
        ...prev,
        isProcessing: false,
        activeStageIndex: -1,
        activeStageLabel: 'Pipeline Idle',
        detailedMessage: 'Pipeline state reset. Click GENERATE VIRAL IDEAS to begin.',
      }));
      setMessage('✓ Pipeline state cleared. Ready to start fresh.');
      setMessageType('success');
      setTimeout(() => setMessage(''), 4000);
    } catch (_) {}
  };

  const handleGenerateClick = () => {
    if (credits < 1) {
      setIsUpiModalOpen(true);
      return;
    }
    executeGenerate();
  };

  const statCards = [
    { name: 'Video Credits', value: `${credits} Left`, icon: Coins, color: '#26e200' },
    { name: 'Generated Today', value: stats.generated, icon: Play, color: '#3b82f6' },
    { name: 'Awaiting Approval', value: String(livePendingApproval), icon: Clock, color: '#f59e0b' },
    { name: 'Approved', value: String(stats.approved), icon: CheckCircle, color: '#10b981' },
    { name: 'Published', value: String(stats.published), icon: ArrowRight, color: '#8b5cf6' },
  ];

  return (
    <div className="flex flex-col gap-6 sm:gap-8 w-full max-w-full overflow-hidden">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Universal AI Content Engine — Automated short-form video generation & YouTube distribution
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {/* Redeem VIP Pass Button */}
          <button
            onClick={() => {
              setInitialRedeemToken('');
              setIsRedeemModalOpen(true);
            }}
            className="flex items-center justify-center gap-1.5 bg-[#fe017f]/10 hover:bg-[#fe017f]/20 border border-[#fe017f]/30 rounded-xl px-3.5 py-2.5 text-[#fe017f] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm w-full sm:w-auto"
            title="Redeem family/friends VIP pass"
          >
            <Gift size={16} />
            <span>Redeem VIP Token</span>
          </button>

          {/* Top Up Button */}
          <button
            onClick={() => setIsUpiModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#26e200]/10 hover:bg-[#26e200]/20 border border-[#26e200]/30 rounded-xl px-4 py-2.5 text-[#26e200] text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <Coins size={16} />
            <span>Top Up UPI (from ₹9)</span>
          </button>

          {isPaused && (
            <div className="flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 text-red-400 text-xs sm:text-sm font-semibold">
              <PauseCircle size={16} />
              <span>AUTOMATION PAUSED</span>
            </div>
          )}

          <button
            onClick={handleGenerateClick}
            disabled={isGenerating || isPaused}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg w-full sm:w-auto ${
              isGenerating || isPaused
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-[#26e200] to-[#16a34a] hover:from-[#20be00] hover:to-[#15803d] text-black shadow-[0_4px_20px_rgba(38,226,0,0.3)] active:scale-[0.98]'
            }`}
          >
            <Zap size={16} className={isGenerating ? "animate-spin" : "fill-black"} />
            <span>{isGenerating ? 'Generating...' : 'GENERATE VIRAL IDEAS'}</span>
          </button>
        </div>
      </div>

      {/* UPI Pay-As-You-Go Promo Banner if low on credits */}
      {credits < 2 && (
        <div className="bg-gradient-to-r from-[#26e200]/10 via-[#26e200]/5 to-[#fe017f]/10 border-2 border-[#26e200]/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl shrink-0">⚡️</span>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">
                Pay-As-You-Go: Recharges Start at Just ₹9 via UPI
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5 leading-relaxed">
                Instant activation with Google Pay, PhonePe, Paytm, or CRED. No monthly commitments.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpiModalOpen(true)}
            className="w-full sm:w-auto shrink-0 bg-[#26e200] hover:bg-[#20be00] text-black font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md text-center"
          >
            Recharge Now →
          </button>
        </div>
      )}

      {/* Feedback message */}
      {message && (
        <div className={`p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm font-medium border ${
          messageType === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-red-500/10 border-red-500/30 text-red-300'
        }`}>
          {message}
        </div>
      )}

      {/* Stats Grid - 2 cols on mobile, 3 on tablet, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <div 
            key={stat.name} 
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 sm:p-5 flex items-center gap-3 shadow-sm hover:border-slate-700 transition-colors"
          >
            <div 
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${stat.color}15` }}
            >
              <stat.icon size={18} color={stat.color} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate">{stat.name}</p>
              <p className="text-base sm:text-xl font-black text-white mt-0.5 truncate">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── AUTONOMOUS AUTO-PILOT ENGINE CARD ────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border-2 border-indigo-500/30 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Autonomous Auto-Pilot Engine
                </h3>
                {autopilotState.status === 'active' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    AUTO-PILOT ACTIVE
                  </span>
                ) : autopilotState.status === 'paused' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    PAUSED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                    Standby
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Generates, renders, and publishes viral Shorts directly to your YouTube channel without you needing to manually approve each one.
              </p>
            </div>
          </div>

          {/* Quick Auto-Publish Toggle */}
          <div className="flex items-center gap-3 bg-slate-950/60 p-2.5 sm:p-3 rounded-xl border border-slate-800 shrink-0">
            <span className="text-xs text-slate-300 font-medium">Auto-Publish to YouTube:</span>
            <button
              type="button"
              onClick={() => handleToggleAutoPublish(!autopilotState.autoPublish)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autopilotState.autoPublish ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  autopilotState.autoPublish ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Active Auto-Pilot Progress Display */}
        {autopilotState.status === 'active' ? (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-emerald-400" />
                  {autopilotState.remaining === -1
                    ? `Continuous Mode Active: Publishing until credits run out (${credits} credits remaining)`
                    : `Batch in Progress: ${autopilotState.remaining} video(s) remaining`}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Each video will be researched, scripted, voiced, rendered, and automatically uploaded to YouTube Shorts.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStopAutopilot}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 hover:text-red-200 text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
              >
                <Power className="w-3.5 h-3.5" /> Stop Auto-Pilot
              </button>
            </div>

            {/* Batch Progress Bar if not unlimited */}
            {autopilotState.remaining > 0 && autopilotState.total > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Batch Progress</span>
                  <span>{autopilotState.total - autopilotState.remaining} / {autopilotState.total} Videos Completed</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round(((autopilotState.total - autopilotState.remaining) / autopilotState.total) * 100))}%`
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Auto-Pilot Configuration & Launch Controls */
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: 8 Videos */}
              <button
                type="button"
                onClick={() => setAutopilotMode('8')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  autopilotMode === '8'
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400 uppercase tracking-wider">Recommended</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${autopilotMode === '8' ? 'border-indigo-400 bg-indigo-500' : 'border-slate-700'}`}>
                    {autopilotMode === '8' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-base font-bold text-white">Publish 8 Videos</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Creates & publishes an 8-video batch autonomously</p>
                </div>
                <p className="text-[11px] font-mono text-indigo-300/80 mt-2">Cost: 8 Credits</p>
              </button>

              {/* Option 2: Unlimited (Until Credits Run Out) */}
              <button
                type="button"
                onClick={() => setAutopilotMode('unlimited')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  autopilotMode === 'unlimited'
                    ? 'bg-[#26e200]/15 border-[#26e200] shadow-md shadow-[#26e200]/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#26e200] uppercase tracking-wider">Continuous</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${autopilotMode === 'unlimited' ? 'border-[#26e200] bg-[#26e200]' : 'border-slate-700'}`}>
                    {autopilotMode === 'unlimited' && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                  </div>
                </div>
                <div className="mt-2">
                  <h4 className="text-base font-bold text-white">Until Credits End</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Runs continuously until all your credits are used</p>
                </div>
                <p className="text-[11px] font-mono text-[#26e200]/80 mt-2">{credits} Videos Available</p>
              </button>

              {/* Option 3: Custom Count */}
              <button
                type="button"
                onClick={() => setAutopilotMode('custom')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  autopilotMode === 'custom'
                    ? 'bg-purple-600/15 border-purple-500 shadow-md shadow-purple-500/10'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-400 uppercase tracking-wider">Custom Batch</span>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${autopilotMode === 'custom' ? 'border-purple-400 bg-purple-500' : 'border-slate-700'}`}>
                    {autopilotMode === 'custom' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={Math.min(50, Math.max(1, credits))}
                      value={customBatchCount}
                      onChange={(e) => {
                        setCustomBatchCount(Math.max(1, parseInt(e.target.value) || 1));
                        setAutopilotMode('custom');
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-sm text-white font-bold"
                    />
                    <span className="text-xs text-slate-300">Videos</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Set any batch count up to your balance</p>
                </div>
                <p className="text-[11px] font-mono text-purple-300/80 mt-2">Cost: {customBatchCount} Credits</p>
              </button>
            </div>

            {/* Launch Auto-Pilot Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <div className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>⚡️</span>
                <span>Each video takes ~35s to generate and automatically publishes to YouTube Shorts.</span>
              </div>
              <button
                type="button"
                onClick={handleStartAutopilot}
                disabled={isStartingAutopilot || credits < 1 || isPaused}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition shadow-lg cursor-pointer bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white shadow-indigo-500/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isStartingAutopilot ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Initiating Auto-Pilot...</span>
                  </>
                ) : (
                  <>
                    <Rocket className="w-4 h-4" />
                    <span>
                      {autopilotMode === '8'
                        ? 'Launch 8-Video Auto-Pilot'
                        : autopilotMode === 'unlimited'
                        ? 'Launch Continuous Auto-Pilot'
                        : `Launch ${customBatchCount}-Video Auto-Pilot`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── AUTONOMOUS PIPELINE STAGES WITH REAL-TIME GLOW ─────────────────── */}
      <div className="bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-5 sm:p-7 shadow-lg space-y-6">
        
        {/* Header & Live Progress Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Autonomous Pipeline Stages
              </h2>
              {pipelineStatus.isProcessing ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#2fcaee]/15 text-[#2fcaee] text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[#2fcaee]/40 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#2fcaee] animate-ping" />
                    Live Processing
                  </span>
                  <button
                    onClick={handleResetPipeline}
                    className="text-[11px] text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-500/50 rounded-lg px-2 py-0.5 transition-colors cursor-pointer"
                    title="Click if generation seems stuck to reset and try again"
                  >
                    Reset
                  </button>
                </div>
              ) : (pipelineStatus.activeStageIndex === 7 || pipelineStatus.completedStages.includes(6) || (pipelineStatus.completedStages.includes(5) && !pipelineStatus.isProcessing)) ? (
                <span className="inline-flex items-center gap-1.5 bg-[#26e200]/15 text-[#26e200] text-[11px] font-black px-2.5 py-0.5 rounded-full border border-[#26e200]/40">
                  <Check size={12} />
                  Ready For Approval
                </span>
              ) : null}
            </div>
            
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
              {pipelineStatus.detailedMessage || 'Visual progress tracker — icons glow live as each stage completes.'}
            </p>
          </div>

          {/* Direct CTA when video is ready for approval */}
          {(pipelineStatus.activeStageIndex === 7 || pipelineStatus.completedStages.includes(6) || (pipelineStatus.completedStages.includes(5) && !pipelineStatus.isProcessing)) && (
            <Link
              href="/approval"
              className="bg-[#26e200] hover:bg-[#20be00] text-black text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(38,226,0,0.5)] active:scale-95 transition-all shrink-0 w-fit"
            >
              <span>Review & Approve Video</span>
              <ArrowRight size={14} />
            </Link>
          )}

          {/* Direct CTA when video is published */}
          {pipelineStatus.completedStages.includes(8) && (
            <Link
              href="/published"
              className="bg-purple-500 hover:bg-purple-600 text-white text-xs font-black px-4 py-2 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0 w-fit"
            >
              <span>View In Published Hub →</span>
            </Link>
          )}
        </div>

        {/* Live Animated Glowing Progress Bar */}
        <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800 p-0.5 shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-[#26e200] via-[#2fcaee] to-[#fe017f] rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(47,202,238,0.9)]"
            style={{ width: `${pipelineStatus.progressPercent || (pipelineStatus.isProcessing ? 12 : 0)}%` }}
          />
        </div>

        {/* Horizontal Stages Chain */}
        <div className="flex items-center justify-start overflow-x-auto pb-4 pt-2 gap-2 sm:gap-3 scrollbar-thin">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = pipelineStatus.completedStages.includes(idx);
            const isActive = pipelineStatus.activeStageIndex === idx;
            const isUpcoming = !isCompleted && !isActive;

            return (
              <div key={step.label} className="flex items-center shrink-0">
                <div className="flex flex-col items-center min-w-[70px] sm:min-w-[85px]">
                  
                  {/* Stage Icon Circle with Real-Time Glowing Halo */}
                  <div className="relative flex items-center justify-center">
                    
                    {/* Glowing Neon Halo for Active Stage */}
                    {isActive && (
                      <div className="absolute -inset-2 rounded-full bg-[#2fcaee] opacity-75 blur-md animate-pulse" />
                    )}

                    {/* Glowing Halo for Completed Stage */}
                    {isCompleted && (
                      <div className="absolute -inset-1 rounded-full bg-[#26e200] opacity-30 blur-sm" />
                    )}

                    {/* The Icon Disc */}
                    <div
                      className={`relative flex items-center justify-center rounded-full transition-all duration-500 ${
                        isActive
                          ? 'w-12 h-12 sm:w-14 sm:h-14 bg-cyan-950 border-3 border-[#2fcaee] text-xl sm:text-2xl shadow-[0_0_30px_rgba(47,202,238,0.9)] scale-110 ring-4 ring-[#2fcaee]/30'
                          : isCompleted
                          ? 'w-10 h-10 sm:w-12 sm:h-12 bg-emerald-950/80 border-2 border-[#26e200] text-base sm:text-lg shadow-[0_0_16px_rgba(38,226,0,0.6)]'
                          : 'w-10 h-10 sm:w-11 sm:h-11 bg-slate-800/80 border-2 border-slate-700/60 text-base sm:text-lg opacity-40'
                      }`}
                    >
                      {step.icon}
                    </div>

                    {/* Active Ping Beacon */}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2fcaee] opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#2fcaee] border-2 border-slate-900"></span>
                      </span>
                    )}

                    {/* Completed Checkmark Badge */}
                    {isCompleted && !isActive && (
                      <span className="absolute -top-1 -right-1 bg-[#26e200] text-black text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center shadow-[0_0_8px_rgba(38,226,0,0.8)] z-10">
                        ✓
                      </span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`mt-2.5 text-xs text-center transition-colors ${
                      isActive
                        ? 'text-[#2fcaee] font-black tracking-wider uppercase drop-shadow-[0_0_8px_rgba(47,202,238,0.8)]'
                        : isCompleted
                        ? 'text-[#26e200] font-bold'
                        : 'text-slate-500 font-medium'
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Subtitle description */}
                  <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5 text-center">
                    {step.desc}
                  </span>
                </div>

                {/* Connecting Line Between Stages */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={`w-6 sm:w-10 h-1 mb-8 shrink-0 rounded-full transition-all duration-500 ${
                      isCompleted && (pipelineStatus.completedStages.includes(idx + 1) || pipelineStatus.activeStageIndex === idx + 1)
                        ? 'bg-[#26e200] shadow-[0_0_10px_rgba(38,226,0,0.8)]'
                        : isActive
                        ? 'bg-gradient-to-r from-[#2fcaee] to-slate-800 animate-pulse'
                        : 'bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Pay-As-You-Go UPI Modal */}
      <UpiPaymentModal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        reason="You need video generation credits before starting a new pipeline."
        onSuccess={(newCredits) => {
          setCredits(newCredits);
          // Automatically trigger generation now that credits are loaded!
          executeGenerate();
        }}
      />

      {/* Redeem VIP Token Modal */}
      <RedeemTokenModal
        isOpen={isRedeemModalOpen}
        initialToken={initialRedeemToken}
        onClose={() => setIsRedeemModalOpen(false)}
        onSuccess={(newCredits) => {
          setCredits(newCredits);
          setMessage(`✓ VIP Pass activated! Balance updated to ${newCredits} video credits.`);
          setMessageType('success');
        }}
      />

    </div>
  );
}
