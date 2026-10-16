'use client';

import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, Download, AlertCircle } from 'lucide-react';

export function VideoPreview({ url }: { url: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
    setHasError(false);
  }, [url, retryCount]);

  if (!url) return null;

  // Use stable URL with retry cache-buster only if retry clicked
  const videoSrc = retryCount > 0 ? `${url}?r=${retryCount}` : url;

  const handlePlayToggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = false;
          videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
        }
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex flex-col items-center">
      <div className="relative w-full aspect-[9/16] max-h-[72vh] flex items-center justify-center bg-black">
        {hasError ? (
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-400" />
            <p className="text-sm font-semibold text-slate-200">Video preview loading...</p>
            <p className="text-xs text-slate-400">If the video just finished rendering, click retry to refresh buffer.</p>
            <button
              onClick={() => {
                setHasError(false);
                setRetryCount(c => c + 1);
              }}
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Retry Video
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              loop
              playsInline
              preload="auto"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => {
                console.warn('Video playback error:', e);
                setHasError(true);
              }}
              className="w-full h-full object-contain cursor-pointer"
              onClick={handlePlayToggle}
            />

            {/* Tap to Play overlay when paused */}
            {!isPlaying && (
              <button
                onClick={handlePlayToggle}
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition transform hover:scale-105 group backdrop-blur-sm cursor-pointer z-10"
                aria-label="Play Video"
              >
                <Play className="w-7 h-7 ml-1 fill-white" />
              </button>
            )}

            {/* Sound Notice Pill */}
            {!isPlaying && (
              <div className="absolute top-4 left-4 bg-red-600/90 text-white text-xs px-2.5 py-1 rounded-full pointer-events-none font-semibold flex items-center gap-1.5 shadow-md z-10">
                <Volume2 className="w-3.5 h-3.5" /> Sound ON
              </div>
            )}
          </>
        )}
      </div>

      {/* Action Bar beneath preview */}
      <div className="w-full p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <span className="font-medium text-slate-300">1080x1920 (9:16 Shorts)</span>
        <a
          href={url}
          download="viral_short.mp4"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" /> Download MP4
        </a>
      </div>
    </div>
  );
}
