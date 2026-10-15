import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/Badge';
import { formatDistanceToNow } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  const videos = await prisma.video.findMany({
    where: {
      script: {
        topic: {
          userId
        }
      }
    },
    include: {
      script: {
        include: {
          topic: true,
          voiceAsset: true,
          visualAssets: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Generated Videos</h1>
        <span className="text-sm text-slate-400">{videos.length} videos total</span>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Duration</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Resolution</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">QA Score</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Assets</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {videos.map((video) => {
              const qaColor = (video.qaScore || 0) >= 90 ? '#10b981' : (video.qaScore || 0) >= 70 ? '#f59e0b' : '#ef4444';
              return (
                <tr key={video.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-200 truncate max-w-xs">
                      {video.script.topic.title}
                    </p>
                    {video.script.hook && (
                      <p className="text-xs text-slate-500 mt-0.5 italic truncate max-w-xs">
                        &quot;{video.script.hook}&quot;
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                      background: 'rgba(139,92,246,0.1)', color: '#a78bfa',
                      border: '1px solid rgba(139,92,246,0.2)', fontWeight: 600
                    }}>
                      {video.script.topic.category}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-400">
                    {video.duration}s
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                    {video.resolution}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {video.qaScore !== null ? (
                      <span style={{ fontSize: '13px', fontWeight: 700, color: qaColor }}>
                        {video.qaScore}/100
                      </span>
                    ) : (
                      <span className="text-slate-600 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <Badge status={video.status} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                    <span className="mr-2">{video.script.visualAssets.length} visuals</span>
                    {video.script.voiceAsset && <span>🎙️ voice</span>}
                  </td>
                </tr>
              );
            })}
            {videos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                  No videos rendered yet. Run the pipeline from the dashboard.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
