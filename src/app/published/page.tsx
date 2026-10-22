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

      <div className="rounded-xl bg-slate-900 border border-slate-800 shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900/50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Topic</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Platform</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Published At</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Action</th>
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  {pub.platform === 'YOUTUBE_SHORTS' && pub.externalId && !pub.externalId.startsWith('mock') ? (
                    <a
                      href={`https://youtube.com/shorts/${pub.externalId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-semibold border border-red-500/30 transition"
                    >
                      View on YouTube <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">Live</span>
                  )}
                </td>
              </tr>
            ))}
            {publications.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
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
