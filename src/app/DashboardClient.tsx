'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle, Clock, XCircle, Play, AlertCircle, Zap, PauseCircle, TrendingUp } from 'lucide-react';

const JOB_STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  PROCESSING: '#3b82f6',
  PENDING: '#f59e0b',
  RETRYING: '#f97316'
};

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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setMessage('');
    try {
      const res = await fetch('/api/pipeline/generate', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('✓ Pipeline started! Topics are being generated in the background.');
        setMessageType('success');
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

  const statCards = [
    { name: 'Generated Today', value: stats.generated, icon: Play, color: '#3b82f6' },
    { name: 'Awaiting Approval', value: String(stats.pendingApproval), icon: Clock, color: '#f59e0b' },
    { name: 'Approved', value: String(stats.approved), icon: CheckCircle, color: '#10b981' },
    { name: 'Published', value: String(stats.published), icon: ArrowRight, color: '#8b5cf6' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Universal AI Content Engine — India-first short-form video automation
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
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
            onClick={handleGenerate}
            disabled={isGenerating || isPaused}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: isGenerating || isPaused ? '#374151' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              color: 'white', border: 'none', borderRadius: '10px',
              padding: '10px 20px', fontSize: '14px', fontWeight: 700,
              cursor: isGenerating || isPaused ? 'not-allowed' : 'pointer',
              opacity: isPaused ? 0.5 : 1,
              boxShadow: '0 4px 15px rgba(59,130,246,0.3)',
              transition: 'all 0.2s'
            }}
          >
            <Zap size={16} />
            {isGenerating ? 'Generating...' : 'GENERATE VIRAL IDEAS'}
          </button>
        </div>
      </div>

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
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
                <p style={{ fontSize: '24px', fontWeight: 700, color: 'white', margin: '2px 0 0' }}>{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline Visualization */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#cbd5e1', margin: '0 0 20px' }}>
          Content Pipeline
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

    </div>
  );
}
