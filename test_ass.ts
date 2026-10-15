import fs from 'fs';

function generateAssSubtitles(subtitles: { word: string; start: number; end: number }[]): string {
  if (!subtitles || subtitles.length === 0) return '';

  let ass = `[Script Info]
Title: Generated Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Montserrat,90,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,5,3,2,40,40,200,1
Style: Highlight,Montserrat,100,&H0014FF39,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,6,4,2,40,40,200,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const chunkSize = 3;
  for (let i = 0; i < subtitles.length; i += chunkSize) {
    const chunk = subtitles.slice(i, Math.min(i + chunkSize, subtitles.length));
    
    const formatTime = (t: number) => {
      const h = Math.floor(t / 3600);
      const m = Math.floor((t % 3600) / 60);
      const s = Math.floor(t % 60);
      const cs = Math.floor((t % 1) * 100);
      return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
    };

    for (let j = 0; j < chunk.length; j++) {
      const wordStart = chunk[j].start;
      const wordEnd = chunk[j].end;
      
      const lineText = chunk.map((w, k) => {
        if (k === j) {
          return `{\\c&H0014FF39&\\fs100\\b1}${w.word.toUpperCase()}{\\r}`;
        }
        return w.word.toUpperCase();
      }).join(' ');

      ass += `Dialogue: 0,${formatTime(wordStart)},${formatTime(wordEnd)},Default,,0,0,0,,${lineText}\n`;
    }
  }

  return ass;
}

const mockSubtitles = [
  { word: "Hello", start: 0, end: 0.5 },
  { word: "world", start: 0.5, end: 1 },
  { word: "this", start: 1, end: 1.5 },
  { word: "is", start: 1.5, end: 2 },
  { word: "a", start: 2, end: 2.5 },
  { word: "test", start: 2.5, end: 3 }
];

const assContent = generateAssSubtitles(mockSubtitles);
console.log(assContent);
