'use client';

import { Player } from '@remotion/player';
import { TemplateA } from '@/remotion/TemplateA';
import { TemplateB } from '@/remotion/TemplateB';
import { TemplateC } from '@/remotion/TemplateC';
import { SplitScreenTemplate } from '@/remotion/SplitScreenTemplate';
import { GameplayFactsTemplate } from '@/remotion/GameplayFactsTemplate';

export function VideoPlayer({ 
  template, 
  script, 
  voice, 
  visuals 
}: { 
  template: string,
  script?: any,
  voice?: any,
  visuals?: any[]
}) {
  const getTemplate = () => {
    switch (template) {
      case 'GameplayFactsTemplate': return GameplayFactsTemplate;
      case 'SplitScreenTemplate': return SplitScreenTemplate;
      case 'TemplateA': return TemplateA;
      case 'TemplateB': return TemplateB;
      case 'TemplateC': return TemplateC;
      default: return GameplayFactsTemplate;
    }
  };

  return (
    <div className="rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-black flex justify-center items-center p-4">
      <Player
        component={getTemplate()}
        durationInFrames={voice?.duration ? Math.ceil(voice.duration * 30) : 30 * 15}
        fps={30}
        compositionWidth={1080}
        compositionHeight={1920}
        controls
        autoPlay
        loop
        style={{
          width: '100%',
          maxHeight: '70vh',
          aspectRatio: '9/16'
        }}
        inputProps={{ script, voice, visuals: visuals ?? [] }}
      />
    </div>
  );
}
