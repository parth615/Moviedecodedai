import React from 'react';
import { AbsoluteFill, Img, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

export const TemplateB: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const translateY = interpolate(frame, [0, 20], [50, 0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#FAF9F6' }}>
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ width: 800, height: 800, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <Img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', bottom: 200, left: 100, right: 100, textAlign: 'center', opacity, transform: `translateY(${translateY}px)` }}>
        <h1 style={{ color: '#333', fontSize: 70, fontFamily: 'serif', fontWeight: 'bold' }}>
          Minimal Psychology
        </h1>
        <div style={{ backgroundColor: 'white', padding: '20px 40px', borderRadius: 20, display: 'inline-block', marginTop: 40, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#555', fontSize: 35, fontFamily: 'sans-serif', margin: 0 }}>
            Highlighted psychological concepts...
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
