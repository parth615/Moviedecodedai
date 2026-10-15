import React from 'react';
import { AbsoluteFill, Img, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

export const TemplateC: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const translateY = interpolate(frame, [0, 30], [20, 0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0f172a' }}>
      <AbsoluteFill style={{ padding: 40 }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 40, overflow: 'hidden', position: 'relative', border: '2px solid rgba(255,215,0,0.3)' }}>
          <Img src="https://images.unsplash.com/photo-1556761175-4b46a572b786?w=1080&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          <AbsoluteFill style={{ background: 'linear-gradient(to top, rgba(15,23,42,1) 0%, rgba(15,23,42,0.2) 100%)' }} />
          
          <div style={{ position: 'absolute', bottom: 150, left: 60, right: 60, opacity, transform: `translateY(${translateY}px)` }}>
            <h2 style={{ color: '#ffd700', fontSize: 30, fontFamily: 'sans-serif', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 20 }}>Business Story</h2>
            <h1 style={{ color: 'white', fontSize: 70, fontFamily: 'serif', lineHeight: 1.1, margin: 0 }}>
              The billion dollar strategy you missed.
            </h1>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
