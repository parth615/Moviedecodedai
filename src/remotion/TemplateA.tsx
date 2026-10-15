import React from 'react';
import { AbsoluteFill, Img, useVideoConfig, useCurrentFrame, interpolate } from 'remotion';

export const TemplateA: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const scale = interpolate(frame, [0, 1800], [1, 1.1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <AbsoluteFill style={{ opacity, transform: `scale(${scale})` }}>
        <Img src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1080&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} />
      <div style={{ position: 'absolute', bottom: 300, left: 100, right: 100, textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 80, fontFamily: 'sans-serif', fontWeight: 'bold', textShadow: '2px 2px 10px rgba(0,0,0,0.8)' }}>
          DARK CINEMATIC
        </h1>
        <p style={{ color: '#aaa', fontSize: 40, fontFamily: 'sans-serif', marginTop: 20 }}>
          Generating realistic mock captions...
        </p>
      </div>
    </AbsoluteFill>
  );
};
