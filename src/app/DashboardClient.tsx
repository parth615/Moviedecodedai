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
  Sparkles,
  CreditCard
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
    { name: 'Video Credits', value: `${credits} Left`, icon: Coins, color: '#eab308' },
    { name: 'Generated Today', value: stats.generated, icon: Play, color: '#3b82f6' },
    { name: 'Awaiting Approval', value: String(stats.pendingApproval), icon: Clock, color: '#f59e0b' },
    { name: 'Approved', value: String(stats.approved), icon: CheckCircle, color: '#10b981' },
    { name: 'Published', value: String(stats.published), icon: ArrowRight, color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Universal AI Content Engine — Automated short-form video generation & YouTube distribution
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Top Up Button */}
          <button
            onClick={() => setIsUpiModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(38,226,0,0.1)', border: '1px solid rgba(38,226,0,0.3)',
              borderRadius: '10px', padding: '10px 16px', color: '#26e200', fontSize: '13px', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Coins size={16} />
            <span>Top Up UPI (from ₹9)</span>
          </button>

          {isPaused && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '8px', padding: '8px 14px', color: '#f87171', fontSize: '13px', fontWeight: 600
            }}>
              <PauseCircle size={16} />
              AUTOMATION PAUSED
            </div>
          )}

          <button
            onClick={handleGenerateClick}
            disabled={isGenerating || isPaused}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: isGenerating || isPaused ? '#374151' : 'linear-gradient(135deg, #26e200, #16a34a)',
              color: 'black', border: 'none', borderRadius: '10px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 800,
              cursor: isGenerating || isPaused ? 'not-allowed' : 'pointer',
              opacity: isPaused ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(38,226,0,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={16} className="fill-black" />
            {isGenerating ? 'Generating...' : 'GENERATE VIRAL IDEAS'}
          </button>
        </div>
      </div>

      {/* UPI Pay-As-You-Go Promo Banner if low on credits */}
      {credits < 2 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(38,226,0,0.1), rgba(254,1,127,0.05))',
          border: '2px solid rgba(38,226,0,0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚡️</span>
            <div>
              <h3 style={{ color: 'white', fontWeight: 800, fontSize: '15px', margin: 0 }}>
                Pay-As-You-Go: Recharges Start at Just ₹9 via UPI
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '13px', margin: '2px 0 0' }}>
                Instant activation with Google Pay, PhonePe, Paytm, or CRED. No monthly commitments.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsUpiModalOpen(true)}
            style={{
              background: '#26e200', color: 'black', fontWeight: 800, fontSize: '13px',
              padding: '8px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer'
            }}
          >
            Recharge Now →
          </button>
        </div>
      )}

      {/* Feedback message */}
      {message && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '10px',
          background: messageType === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${messageType === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: messageType === 'success' ? '#34d399' : '#f87171',
          fontSize: '14px', fontWeight: 500
        }}>
          {message}
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {statCards.map((stat) => (
          <div key={stat.name} style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: '12px', padding: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: `${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <stat.icon size={20} color={stat.color} />
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{stat.name}</p>
                <p style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: '2px 0 0' }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Visualization */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 20px' }}>
          Autonomous Pipeline Stages
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', gap: '4px' }}>
          {PIPELINE_STEPS.map((step, idx) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#1e293b', border: '2px solid #334155',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {step.icon}
                </div>
                <span style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{step.label}</span>
              </div>
              {idx < PIPELINE_STEPS.length - 1 && (
                <div style={{ width: '32px', height: '2px', background: '#1e293b', margin: '0 4px', marginBottom: '20px' }} />
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
