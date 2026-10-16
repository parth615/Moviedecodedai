'use client';

import { useState, useEffect } from 'react';
import { X, Gift, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

interface RedeemTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  onSuccess: (newCredits: number) => void;
}

export function RedeemTokenModal({
  isOpen,
  onClose,
  initialToken = '',
  onSuccess,
}: RedeemTokenModalProps) {
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (initialToken) setToken(initialToken);
    setError('');
    setSuccessMsg('');
  }, [initialToken, isOpen]);

  if (!isOpen) return null;

  const handleRedeem = async () => {
    if (!token.trim()) {
      setError('Please enter a VIP token code.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || 'VIP Pass Redeemed!');
        setTimeout(() => {
          onSuccess(data.newCredits);
          onClose();
        }, 1600);
      } else {
        setError(data.error || 'Failed to redeem token.');
      }
    } catch (e: any) {
      setError(e.message || 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-950 border-2 border-[#fe017f] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(254,1,127,0.3)] brutal-shadow-pink my-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 p-2 rounded-full border border-slate-700 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#fe017f]/15 text-[#fe017f] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-[#fe017f]/30 mb-2">
            <Gift size={14} className="text-[#fe017f]" />
            VIP & Friends Gift Pass
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            REDEEM FREE VIDEOS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enter your secret VIP token to instantly add free video generation credits to your account.
          </p>
        </div>

        {/* Success Banner */}
        {successMsg ? (
          <div className="bg-[#26e200]/20 border-2 border-[#26e200] rounded-2xl p-6 text-center space-y-3 animate-wiggle">
            <CheckCircle2 size={44} className="mx-auto text-[#26e200]" />
            <h3 className="text-lg font-black text-white uppercase">Pass Redeemed!</h3>
            <p className="text-xs sm:text-sm text-[#26e200] font-bold">
              {successMsg}
            </p>
            <p className="text-xs text-slate-400">Updating your balance now...</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-2">
                Enter VIP Token / Code:
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="e.g. PARTH-VIP-100"
                className="w-full bg-slate-900 border-2 border-slate-700 focus:border-[#fe017f] rounded-xl px-4 py-3 text-base text-white placeholder-slate-500 font-mono font-bold tracking-wider outline-none uppercase transition-colors"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-bold bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl">
                {error}
              </p>
            )}

            <button
              onClick={handleRedeem}
              disabled={loading || !token.trim()}
              className="w-full bg-[#fe017f] hover:bg-[#d6006b] text-white text-sm font-black py-3.5 px-6 rounded-xl uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg brutal-shadow-pink"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Redeeming...' : 'Claim Free Video Credits'}</span>
              <ArrowRight size={16} />
            </button>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-center">
              <p className="text-[11px] text-slate-400">
                Shared exclusively for family, close friends, and select VIP creator partners.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
