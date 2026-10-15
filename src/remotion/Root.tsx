import React from 'react';
import { Composition } from 'remotion';
import { TemplateA } from './TemplateA';
import { TemplateB } from './TemplateB';
import { TemplateC } from './TemplateC';
import { SplitScreenTemplate } from './SplitScreenTemplate';
import { GameplayFactsTemplate } from './GameplayFactsTemplate';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TemplateA"
        component={TemplateA}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TemplateB"
        component={TemplateB}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TemplateC"
        component={TemplateC}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="SplitScreenTemplate"
        component={SplitScreenTemplate}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ script: {}, voice: {}, visuals: [] }}
      />
      <Composition
        id="GameplayFactsTemplate"
        component={GameplayFactsTemplate}
        durationInFrames={30 * 60}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{ script: {}, voice: {}, visuals: [] }}
      />
    </>
  );
};
