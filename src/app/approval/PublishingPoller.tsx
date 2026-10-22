'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, CheckCircle2, ExternalLink } from 'lucide-react';

interface PublishingPollerProps {
  videoId: string;
  initialStatus: string;
  onReset?: () => void;
}

export function PublishingPoller({ videoId, initialStatus }: PublishingPollerProps) {
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [publishedData, setPublishedData] = useState<{ isPublished: boolean; youtubeId?: string | null } | null>(null);

  useEffect(() => {
    if (initialStatus !== 'APPROVED') return;

    // Elapsed seconds timer
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    // Auto-poll status every 2 seconds
    const poller = setInterval(async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}/status?t=${Date.now()}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === 'PUBLISHED') {
          clearInterval(poller);
          clearInterval(timer);
          setPublishedData({
            isPublished: true,
            youtubeId: data.youtubeId,
          });

          // Give user 3 seconds to see the link before transitioning to next video
          setTimeout(() => {
            router.refresh();
          }, 3500);
          return;
        }

        // If status changed to READY_FOR_APPROVAL (e.g. failed and reset by worker)
        if (data.status !== 'APPROVED') {
          clearInterval(poller);
          clearInterval(timer);
          router.refresh();
        }
      } catch (e) {
        // Fallback refresh on error
        router.refresh();
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [videoId, initialStatus, router]);

  if (publishedData?.isPublished) {
    return (
      <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between text-emerald-200 shadow-lg shadow-emerald-950/40">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-300">Successfully Published to YouTube Shorts!</p>
            <p className="text-xs text-emerald-400/80">Your Short is live on your channel. Moving to next video...</p>
          </div>
        </div>
        {publishedData.youtubeId && (
          <a
            href={`https://youtube.com/shorts/${publishedData.youtubeId}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shrink-0"
          >
            Watch Short <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-4 flex items-center justify-between text-blue-200">
      <div className="flex items-center gap-3">
        <RefreshCw className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
        <div>
          <p className="text-sm font-semibold flex items-center gap-2">
            Publishing Video in Background
            <span className="text-xs font-mono bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full border border-blue-700/50">
              {elapsed}s
            </span>
          </p>
          <p className="text-xs text-blue-300/80">Worker is uploading to YouTube Shorts & Instagram Reels. This page will update automatically in seconds.</p>
        </div>
      </div>
    </div>
  );
}
