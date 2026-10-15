'use client';

import { useState } from 'react';
import { CheckCircle2, AlertCircle, XCircle, RefreshCw } from 'lucide-react';

const STATUS_ICONS = {
  GREEN: CheckCircle2,
  YELLOW: AlertCircle,
  RED: XCircle
};

const STATUS_COLORS = {
  GREEN: '#10b981',
  YELLOW: '#f59e0b',
  RED: '#ef4444'
};

export function HealthPageClient({ checks }: { checks: { name: string; status: 'GREEN' | 'YELLOW' | 'RED'; detail: string }[] }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
            color: '#60a5fa', cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Run Health Check
        </button>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {checks.map(check => {
          const Icon = STATUS_ICONS[check.status];
          const color = STATUS_COLORS[check.status];
          return (
            <div key={check.name} style={{
              background: '#0f172a',
              border: `1px solid ${color}20`,
              borderRadius: '10px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={20} color={color} />
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: 0 }}>
                    {check.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '2px 0 0' }}>
                    {check.detail}
                  </p>
                </div>
              </div>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                background: `${color}15`, color, border: `1px solid ${color}30`
              }}>
                {check.status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
