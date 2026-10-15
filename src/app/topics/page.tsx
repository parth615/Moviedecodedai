import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/Badge';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  const topics = await prisma.topic.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  // Count by category for summary
  const categoryMap: Record<string, number> = {};
  for (const t of topics) {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Topics</h1>
        <span className="text-sm text-slate-400">{topics.length} total</span>
      </div>

      {/* Category breakdown */}
      {Object.keys(categoryMap).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryMap).map(([cat, count]) => (
            <span key={cat} style={{
              padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
              background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
              color: '#60a5fa'
            }}>
              {cat} ({count})
            </span>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Title & Hook</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-32">Virality</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Lang</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {topics.map((topic) => (
              <tr key={topic.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4">
                  <p className="text-sm font-semibold text-slate-200">{topic.title}</p>
                  {topic.hook && (
                    <p className="text-xs text-slate-500 mt-0.5 italic truncate max-w-sm">&quot;{topic.hook}&quot;</p>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span style={{
                    fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                    background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                    border: '1px solid rgba(139,92,246,0.2)', fontWeight: 600
                  }}>
                    {topic.category}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div style={{
                      flex: 1, height: '6px', borderRadius: '3px',
                      background: '#1e293b', overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${topic.viralityScore || 0}%`,
                        height: '100%',
                        background: (topic.viralityScore || 0) >= 90 ? '#10b981' : (topic.viralityScore || 0) >= 70 ? '#f59e0b' : '#ef4444',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', minWidth: '32px' }}>
                      {topic.viralityScore || '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <Badge status={topic.status} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                  {topic.language || 'en'}
                </td>
              </tr>
            ))}
            {topics.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No topics yet. Click &ldquo;GENERATE VIRAL IDEAS&rdquo; on the dashboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
