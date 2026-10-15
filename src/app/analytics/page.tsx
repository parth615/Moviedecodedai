import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/Badge';
import { formatDistanceToNow } from 'date-fns';
import { TrendingUp, ThumbsUp, MessageSquare, Eye, Users, Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  const analyticsData = await prisma.analytics.findMany({
    where: { publication: { video: { script: { topic: { userId } } } } },
    include: {
      publication: {
        include: {
          video: {
            include: {
              script: {
                include: {
                  topic: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { fetchedAt: 'desc' }
  });

  // Calculate totals
  const totalViews = analyticsData.reduce((acc, curr) => acc + curr.views, 0);
  const totalLikes = analyticsData.reduce((acc, curr) => acc + curr.likes, 0);
  const totalComments = analyticsData.reduce((acc, curr) => acc + curr.comments, 0);
  const avgRetention = analyticsData.length > 0 
    ? analyticsData.reduce((acc, curr) => acc + curr.retentionRate, 0) / analyticsData.length 
    : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analytics & Learning Loop</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <Users className="w-5 h-5" />
            <h3 className="text-sm font-medium">Total Views</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-pink-400 mb-2">
            <Heart className="w-5 h-5" />
            <h3 className="text-sm font-medium">Total Likes</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalLikes.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <MessageSquare className="w-5 h-5" />
            <h3 className="text-sm font-medium">Total Comments</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalComments.toLocaleString()}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <TrendingUp className="w-5 h-5" />
            <h3 className="text-sm font-medium">Avg Retention</h3>
          </div>
          <p className="text-3xl font-bold text-white">{avgRetention.toFixed(1)}%</p>
        </div>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow overflow-x-auto mt-8">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Publication</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Platform</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Views</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Engagement</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Retention</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {analyticsData.map((data) => (
              <tr key={data.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                  {data.publication.video.script.topic.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {data.publication.platform.replace('_', ' ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200 font-semibold">
                  {data.views.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  <span className="text-pink-400">{data.likes}</span> / <span className="text-emerald-400">{data.comments}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  <span className={data.retentionRate > 60 ? 'text-green-400 font-bold' : (data.retentionRate < 50 ? 'text-red-400' : 'text-slate-300')}>
                    {data.retentionRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
            {analyticsData.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No analytics data available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
