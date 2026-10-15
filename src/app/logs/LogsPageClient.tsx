'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  FAILED: '#ef4444',
  PROCESSING: '#3b82f6',
  PENDING: '#f59e0b',
  RETRYING: '#f97316'
};

export function LogsPageClient({ jobs }: { jobs: any[] }) {
  const [filter, setFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const filters = ['ALL', 'FAILED', 'PROCESSING', 'PENDING', 'COMPLETED'];

  const filtered = filter === 'ALL' ? jobs : jobs.filter(j => j.status === filter);

  const handleRetry = async (jobId: string) => {
    setRetrying(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' });
      if (res.ok) window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setRetrying(null);
    }
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden' }}>
      {/* Filter bar */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
              border: filter === f ? '1px solid #3b82f6' : '1px solid #334155',
              background: filter === f ? 'rgba(59,130,246,0.15)' : 'transparent',
              color: filter === f ? '#60a5fa' : '#64748b',
              cursor: 'pointer'
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: '48px', textAlign: 'center', color: '#475569', fontSize: '14px' }}>
          No jobs found for filter: {filter}
        </div>
      )}

      {filtered.map((job) => (
        <div key={job.id} style={{ borderBottom: '1px solid #0f172a' }}>
          {/* Job Row */}
          <div
            onClick={() => setExpandedId(expandedId === job.id ? null : job.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px', cursor: 'pointer',
              background: expandedId === job.id ? '#1e293b' : 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: STATUS_COLORS[job.status] || '#6b7280',
                flexShrink: 0
              }} />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', fontFamily: 'monospace' }}>
                {job.name}
              </span>
              {job.error && (
                <span style={{
                  fontSize: '12px', color: '#f87171',
                  maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  — {job.error}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{
                fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                background: `${STATUS_COLORS[job.status]}20`,
                color: STATUS_COLORS[job.status] || '#6b7280'
              }}>
                {job.status}
              </span>
              <span style={{ fontSize: '11px', color: '#475569' }}>
                Attempt {job.attemptCount}
              </span>
              <span style={{ fontSize: '11px', color: '#475569' }}>
                {new Date(job.createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
              </span>
              {job.status === 'FAILED' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRetry(job.id); }}
                  disabled={retrying === job.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                    color: '#60a5fa', cursor: 'pointer'
                  }}
                >
                  <RefreshCw size={11} />
                  {retrying === job.id ? 'Retrying...' : 'Retry'}
                </button>
              )}
              {expandedId === job.id ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
            </div>
          </div>

          {/* Expanded Logs */}
          {expandedId === job.id && (
            <div style={{
              padding: '16px 20px 16px 40px',
              background: '#020617',
              borderTop: '1px solid #1e293b'
            }}>
              <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 8px', fontWeight: 600 }}>JOB ID: {job.id}</p>
              {job.data && (
                <p style={{ fontSize: '11px', color: '#475569', margin: '0 0 8px' }}>
                  DATA: <span style={{ color: '#64748b' }}>{job.data}</span>
                </p>
              )}
              <pre style={{
                fontSize: '12px', color: '#94a3b8', whiteSpace: 'pre-wrap',
                wordBreak: 'break-word', margin: 0,
                background: '#0f172a', padding: '12px', borderRadius: '8px',
                maxHeight: '300px', overflowY: 'auto',
                fontFamily: 'monospace', lineHeight: 1.5
              }}>
                {job.logs || '(no logs yet)'}
              </pre>
              {job.error && (
                <pre style={{
                  fontSize: '12px', color: '#f87171', whiteSpace: 'pre-wrap',
                  margin: '8px 0 0',
                  background: 'rgba(239,68,68,0.05)', padding: '12px', borderRadius: '8px',
                  fontFamily: 'monospace', border: '1px solid rgba(239,68,68,0.15)'
                }}>
                  ERROR: {job.error}
                </pre>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
