'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Clock, 
  CheckCircle, 
  ArrowRight, 
  PauseCircle, 
  Zap, 
  Coins, 
  Sparkles
} from 'lucide-react';
import { UpiPaymentModal } from '@/components/UpiPaymentModal';

const PIPELINE_STEPS = [
  { label: 'Ideas', icon: '💡' },
  { label: 'Research', icon: '🔍' },
  { label: 'Scripts', icon: '📝' },
  { label: 'Voice', icon: '🎙️' },
  { label: 'Visuals', icon: '🎬' },
  { label: 'Render', icon: '🖥️' },
  { label: 'QA', icon: '✅' },
  { label: 'Approval', icon: '👤' },
  { label: 'Published', icon: '🚀' }
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [credits, setCredits] = useState<number>(0);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

  // Fetch live credits
  useEffect(() => {
    fetch('/api/user/credits')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.credits === 'number') {
          setCredits(data.credits);
        }
      })
      .catch(() => {});
  }, []);

  const executeGenerate = async () => {
    setIsGenerating(true);
    setMessage('');
    try {
      const res = await fetch('/api/pipeline/generate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('✓ Pipeline started! Topics and video are being generated in the background.');
        setMessageType('success');
        setCredits((prev) => Math.max(0, prev - 1));
      } else if (res.status === 402 || data.error?.includes('credit')) {
        setIsUpiModalOpen(true);
      } else {
        setMessage(`✗ ${data.error || 'Failed to start pipeline.'}`);
        setMessageType('error');
      }
    } catch (e: any) {
      setMessage(`✗ ${e.message}`);
      setMessageType('error');
    } finally {
      setIsGenerating(false);
      setTimeout(() => setMessage(''), 6000);
    }
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
    { name: 'Awaiting Approval', value: String(stats.pendingApproval), icon: Clock, color: '#f59e0b' },
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
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
            <Zap size={16} className="fill-black" />
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

      {/* Pipeline Visualization with smooth horizontal scroll */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-slate-200 mb-4">
          Autonomous Pipeline Stages
        </h2>
        <div className="flex items-center justify-start overflow-x-auto pb-2 gap-2 sm:gap-3 scrollbar-thin">
          {PIPELINE_STEPS.map((step, idx) => (
            <div key={step.label} className="flex items-center shrink-0">
              <div className="flex flex-col items-center min-w-[60px] sm:min-w-[70px]">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-base sm:text-lg shadow-inner">
                  {step.icon}
                </div>
                <span className="mt-2 text-[10px] sm:text-xs text-slate-400 text-center font-medium">
                  {step.label}
                </span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div className="w-5 sm:w-8 h-0.5 bg-slate-800 mb-5 shrink-0" />
              )}
            </div>
          ))}
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

    </div>
  );
}
