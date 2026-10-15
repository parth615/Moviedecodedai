import { prisma } from '@/lib/prisma';
import { AlertCircle, CheckCircle2, Clock, RefreshCw, XCircle, Terminal } from 'lucide-react';
import { LogsPageClient } from './LogsPageClient';

export const dynamic = 'force-dynamic';

export default async function LogsPage() {
  const jobs = await prisma.job.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const failedCount = jobs.filter(j => j.status === 'FAILED').length;
  const pendingCount = jobs.filter(j => j.status === 'PENDING').length;
  const processingCount = jobs.filter(j => j.status === 'PROCESSING').length;
  const completedCount = jobs.filter(j => j.status === 'COMPLETED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={22} color="#3b82f6" />
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'white', margin: 0 }}>
            Job Logs & Error Center
          </h1>
        </div>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Failed', count: failedCount, color: '#ef4444', icon: XCircle },
          { label: 'Processing', count: processingCount, color: '#3b82f6', icon: RefreshCw },
          { label: 'Pending', count: pendingCount, color: '#f59e0b', icon: Clock },
          { label: 'Completed', count: completedCount, color: '#10b981', icon: CheckCircle2 }
        ].map(s => (
          <div key={s.label} style={{
            background: '#0f172a', border: `1px solid ${s.color}30`,
            borderRadius: '10px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px'
          }}>
            <s.icon size={20} color={s.color} />
            <div>
              <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: s.color, margin: 0 }}>{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      <LogsPageClient jobs={jobs} />
    </div>
  );
}
