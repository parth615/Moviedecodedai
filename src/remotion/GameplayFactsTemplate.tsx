import React from 'react';
import { AbsoluteFill, Video, Img, Audio, useVideoConfig, useCurrentFrame, interpolate, Sequence, spring, staticFile } from 'remotion';

const resolveUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
};

export const GameplayFactsTemplate: React.FC<{
  script: any;
  voice: any;
  visuals: any[];
}> = ({ script, voice, visuals }) => {
  const { width, height, fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const gameplayUrl = resolveUrl(script?.gameplayAsset?.url || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1080&q=80');
  const intensity = script?.animationIntensity || 1.0;

  // Subtitle mock decoding
  const subtitles = voice?.subtitles ? JSON.parse(voice.subtitles) : [];
  
  // Find current word
  const currentTime = frame / fps;
  const currentWordIndex = subtitles.findIndex((s: any) => currentTime >= s.start && currentTime <= s.end);
  const currentWord = subtitles[currentWordIndex];

  // Helper to get surrounding words for context
  const getContextWords = () => {
    if (!currentWord) return [];
    
    const context = [];
    const windowSize = 2; // Show 2 words before and 2 words after
    
    for (let i = currentWordIndex - windowSize; i <= currentWordIndex + windowSize; i++) {
      if (i >= 0 && i < subtitles.length) {
        // If word is within a reasonable time gap of current word (e.g. same sentence)
        if (Math.abs(subtitles[i].start - currentWord.start) < 2.0) {
          context.push({
            ...subtitles[i],
            isCurrent: i === currentWordIndex
          });
        }
      }
    }
    return context;
  };

  const contextWords = getContextWords();

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {/* Background: 100% Full Screen Gameplay */}
      <AbsoluteFill style={{ filter: 'brightness(0.3)' }}>
        {gameplayUrl.endsWith('.mp4') ? (
          <Video src={gameplayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted loop />
        ) : (
          <Img src={gameplayUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </AbsoluteFill>
      
      {/* Audio Track (TTS) */}
      {voice?.audioUrl && (
        <Audio src={resolveUrl(voice.audioUrl)} volume={1} />
      )}

      {/* Background Music with Ducking */}
      <Audio 
        src={resolveUrl('/audio/mock-bgm.mp3')} 
        volume={(f) => {
          const t = f / fps;
          // Duck the music if we are within 0.3s of any spoken word
          const isSpeaking = subtitles.some((s: any) => t >= s.start - 0.3 && t <= s.end + 0.3);
          // Interpolate could be used here but a functional volume returning a dynamic value per frame works!
          return isSpeaking ? 0.15 : 0.4;
        }}
        loop
      />

      
      {/* Dark overlay to make text pop slightly better */}
      <AbsoluteFill style={{ backgroundColor: 'rgba(0,0,0,0.3)' }} />

      {/* Visual Assets Sequence (Overlay full screen) */}
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
        {visuals && visuals.length > 0 && visuals.map((visual, i) => {
          const durationPerVisual = Math.floor((voice?.duration || 60) * fps / visuals.length);
          const startFrame = i * durationPerVisual;
          const endFrame = (i + 1) * durationPerVisual;
          const localFrame = Math.max(0, frame - startFrame);
          
          // Pop in animation
          const scale = spring({
            fps,
            frame: localFrame,
            config: { damping: 12, stiffness: 100 },
            durationInFrames: 15
          });

          // Drift slightly over time
          const drift = interpolate(localFrame, [0, durationPerVisual], [1, 1.05 * intensity], { extrapolateRight: 'clamp' });
          const finalScale = scale * drift;

          // Fade out at end
          const opacity = interpolate(frame, [endFrame - 15, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

          return (
            <Sequence key={visual.id} from={startFrame} durationInFrames={durationPerVisual}>
              <div style={{
                opacity,
                transform: `scale(${finalScale})`,
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}>
                {/* Render Image or Video based on assetType */}
                <div className="w-full h-full overflow-hidden">
                  {visual.assetType === 'video' ? (
                    <Video src={resolveUrl(visual.assetUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : (
                    <Img src={resolveUrl(visual.assetUrl)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </div>
              </div>
            </Sequence>
          );
        })}
      </AbsoluteFill>

      {/* Viral Word-by-Word Captions Overlay */}
      <AbsoluteFill style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
        {contextWords.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            width: '85%',
            marginTop: '30%' // Push down slightly
          }}>
            {contextWords.map((cw, idx) => {
              // Only animate the current word
              const wordScale = cw.isCurrent ? 1.1 + Math.sin(frame * 0.5 * intensity) * 0.05 : 1.0;
              
              return (
                <span 
                  key={idx}
                  style={{ 
                    color: cw.isCurrent ? '#39FF14' : '#FFFFFF', // Neon green for active word
                    fontSize: cw.isCurrent ? 110 : 90, 
                    fontFamily: '"Montserrat", "Proxima Nova", sans-serif', 
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    margin: '10px 15px',
                    transition: 'all 0.1s ease',
                    transform: `scale(${wordScale})`,
                    // Heavy stroke / shadow effect characteristic of viral shorts
                    textShadow: `
                      4px 4px 0 #000,
                      -4px -4px 0 #000,
                      4px -4px 0 #000,
                      -4px 4px 0 #000,
                      0px 10px 20px rgba(0,0,0,0.8)
                    `
                  }}
                >
                  {cw.word}
                </span>
              );
            })}
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
