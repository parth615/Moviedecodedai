'use client';

import { useEffect, useRef } from 'react';

export function VideoPreview({ url }: { url: string | null }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
    }
  }, [url]);

  if (!url) return null;

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex justify-center items-center p-4 relative">
      <video
        ref={videoRef}
        src={`${url}?v=${Date.now()}`}
        controls
        loop
        playsInline
        className="w-full max-h-[70vh] object-contain aspect-[9/16]"
      />
      <div className="absolute top-4 left-4 bg-red-600 text-white text-xs px-2 py-1 rounded-md opacity-80 pointer-events-none font-semibold">
        Click to Play (Sound ON)
      </div>
    </div>
  );
}
