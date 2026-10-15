import React from 'react';
import { AbsoluteFill, Video, Img, Audio, useVideoConfig, useCurrentFrame, interpolate, Sequence } from 'remotion';

export const SplitScreenTemplate: React.FC<{
  script: any;
  voice: any;
  visuals: any[];
}> = ({ script, voice, visuals }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const gameplayUrl = script?.gameplayAsset?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4';
  const intensity = script?.animationIntensity || 1.0;

  // Subtitle mock decoding
  const subtitles = voice?.subtitles ? JSON.parse(voice.subtitles) : [];
  
  // Find current word
  const currentTime = frame / fps;
  const currentWord = subtitles.find((s: any) => currentTime >= s.start && currentTime <= s.end);

  return (
    <AbsoluteFill style={{ backgroundColor: '#111' }}>
      {/* Top/Background: Gameplay */}
      <AbsoluteFill style={{ height: '60%', top: 0 }}>
        <Video src={gameplayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop />
      </AbsoluteFill>
      
      {/* Audio Track */}
      {voice?.audioUrl && <Audio src={voice.audioUrl} />}
      
      {/* Gradient divider */}
      <AbsoluteFill style={{ top: '40%', height: '20%', background: 'linear-gradient(to bottom, transparent, #111)' }} />

      {/* Bottom: Visual Assets Sequence */}
      <AbsoluteFill style={{ height: '40%', top: '60%', backgroundColor: '#111', overflow: 'hidden' }}>
        {visuals && visuals.length > 0 ? (
          visuals.map((visual, i) => {
            // Rough calculation to split duration among visuals evenly for mock purposes
            const durationPerVisual = Math.floor((voice?.duration || 60) * fps / visuals.length);
            const startFrame = i * durationPerVisual;
            const endFrame = (i + 1) * durationPerVisual;
            
            // Subtle zoom effect
            const localFrame = Math.max(0, frame - startFrame);
            const scale = interpolate(localFrame, [0, durationPerVisual], [1, 1 + (0.1 * intensity)], { extrapolateRight: 'clamp' });

            return (
              <Sequence key={visual.id} from={startFrame} durationInFrames={durationPerVisual}>
                <Img src={visual.assetUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }} />
              </Sequence>
            );
          })
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#555', fontFamily: 'sans-serif' }}>
            No visual assets available
          </div>
        )}
      </AbsoluteFill>

      {/* Captions Overlay */}
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
        {currentWord && (
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            padding: '20px 40px',
            borderRadius: '20px',
            transform: `scale(${1 + Math.sin(frame * 0.5 * intensity) * 0.05})`, // subtle bounce based on intensity
          }}>
            <h1 style={{ 
              color: '#FFEA00', 
              fontSize: 100, 
              fontFamily: 'Impact, sans-serif', 
              textTransform: 'uppercase',
              textShadow: '0px 10px 20px rgba(0,0,0,0.5)',
              margin: 0
            }}>
              {currentWord.word}
            </h1>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
