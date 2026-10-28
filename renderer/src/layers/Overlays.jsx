import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const POSITION = {
  'top-right': { top: '9%', right: '7%' },
  'top-left': { top: '4%', left: '5%' },
  fullscreen: { inset: 0 },
};

// אמוג'י / תמונה / וידאו B-Roll שמופיעים בזמן מילת המפתח
export const Overlays = ({ overlays, fps }) =>
  overlays.map((o, i) => {
    const from = Math.round(o.start * fps);
    const dur = o.end == null ? undefined : Math.max(1, Math.round((o.end - o.start) * fps));
    return (
      <Sequence key={i} from={from} durationInFrames={dur} layout="none">
        <Overlay o={o} />
      </Sequence>
    );
  });

const Overlay = ({ o }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = o.animation === 'pop' ? spring({ frame, fps, config: { damping: 9, stiffness: 200 } }) : interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const style = { position: 'absolute', ...POSITION[o.position ?? 'top-right'], opacity: (o.opacity ?? 1) * Math.min(1, s * 1.5), transform: o.animation === 'pop' ? `scale(${s}) rotate(${interpolate(s, [0, 1], [-20, 0])}deg)` : undefined };

  if (o.kind === 'emoji') return <div style={{ ...style, fontSize: 200 * (width / 1080), lineHeight: 1 }}>{o.content}</div>;
  if (o.kind === 'image') return <Img src={o.content} style={{ ...style, width: o.position === 'top-left' ? 140 * (width / 1080) : '35%' }} />;
  return (
    <AbsoluteFill style={{ opacity: style.opacity }}>
      <OffthreadVideo src={o.content} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
};
