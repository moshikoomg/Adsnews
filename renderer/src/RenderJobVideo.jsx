import { AbsoluteFill, Audio, useVideoConfig } from 'remotion';
import { Segments } from './layers/Segments.jsx';
import { Captions } from './layers/Captions.jsx';
import { Overlays } from './layers/Overlays.jsx';
import { useBrandFonts } from './fonts.js';

// הקומפוזיציה הראשית: מקבלת RenderJob (ראה render-job.schema.json) ומרכיבה את השכבות
export const RenderJobVideo = ({ job }) => {
  const { fps } = useVideoConfig();
  useBrandFonts();
  const music = job.audio?.music;

  return (
    <AbsoluteFill style={{ backgroundColor: job.style.brand.primary || '#000' }}>
      <Segments job={job} />
      <Overlays overlays={job.overlays} fps={fps} brand={job.style.brand} />
      {job.captions && <Captions captions={job.captions} brand={job.style.brand} />}
      {music?.url && <Audio src={music.url} volume={music.volume ?? 0.2} loop />}
    </AbsoluteFill>
  );
};
