import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/Badge';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, MonitorPlay, Smartphone, Play, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PublishedPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }
  const userId = session.user.id;

  const publications = await prisma.publication.findMany({
    where: { video: { script: { topic: { userId } } } },
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
    },
    orderBy: { publishedAt: 'desc' }
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Publishing Hub</h1>
      </div>

      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow overflow-hidden">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Platform</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Published At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 bg-slate-900">
            {publications.map((pub) => (
              <tr key={pub.id} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">
                  {pub.video.script.topic.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    {pub.platform === 'YOUTUBE_SHORTS' ? <MonitorPlay className="w-4 h-4 text-red-500" /> : <Smartphone className="w-4 h-4 text-pink-500" />}
                    {pub.platform.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{pub.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {pub.publishedAt?.toLocaleDateString() || 'N/A'}
                </td>
              </tr>
            ))}
            {publications.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No published videos yet. Approve some videos first!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
