import { AbsoluteFill, Img, interpolate, OffthreadVideo, Sequence, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const POSITION = {
  'top-right': { top: '11%', right: '7%' },
  'top-left': { top: '11%', left: '7%' },
  top: { top: '9%', left: 0, right: 0, display: 'flex', justifyContent: 'center' },
  center: { top: '38%', left: 0, right: 0, display: 'flex', justifyContent: 'center' },
  bottom: { bottom: '24%', left: 0, right: 0, display: 'flex', justifyContent: 'center' },
  fullscreen: { inset: 0 },
};

// אמוג'י / תמונה / וידאו B-Roll שמופיעים בזמן מילת המפתח
export const Overlays = ({ overlays, fps, brand }) =>
  overlays.map((o, i) => {
    const from = Math.round(o.start * fps);
    const dur = o.end == null ? undefined : Math.max(1, Math.round((o.end - o.start) * fps));
    return (
      <Sequence key={i} from={from} durationInFrames={dur} layout="none">
        <Overlay o={o} brand={brand} />
      </Sequence>
    );
  });

const Overlay = ({ o, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const s = o.animation === 'pop' ? spring({ frame, fps, config: { damping: 9, stiffness: 200 } }) : interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const style = { position: 'absolute', ...POSITION[o.position ?? 'top-right'], opacity: (o.opacity ?? 1) * Math.min(1, s * 1.5), transform: o.animation === 'pop' ? `scale(${s}) rotate(${interpolate(s, [0, 1], [-20, 0])}deg)` : undefined };

  const k = width / 1080;
  const font = brand?.fontFamily;
  const inner = (style2) => ({ fontFamily: font, fontWeight: 800, direction: 'rtl', boxShadow: '0 12px 40px rgba(0,0,0,.35)', ...style2 });
  if (o.kind === 'title')
    return <div style={style}><div style={inner({ background: brand?.accent ?? '#fe2c55', color: '#fff', fontSize: 78 * k, padding: `${18 * k}px ${40 * k}px`, borderRadius: 36 * k, maxWidth: '84%', textAlign: 'center', lineHeight: 1.15 })}>{o.content}</div></div>;
  if (o.kind === 'text')
    return <div style={style}><div style={inner({ background: '#fff', color: brand?.accent ?? '#fe2c55', fontSize: 92 * k, padding: `${8 * k}px ${30 * k}px`, borderRadius: 26 * k, rotate: '-3deg' })}>{o.content}</div></div>;
  if (o.kind === 'cta')
    return <div style={style}><div style={inner({ background: '#fff', color: '#000', fontSize: 56 * k, padding: `${20 * k}px ${48 * k}px`, borderRadius: 999 })}>{o.content}</div></div>;
  if (o.kind === 'emoji') return <div style={{ ...style, fontSize: 200 * (width / 1080), lineHeight: 1 }}>{o.content}</div>;
  if (o.kind === 'image') return <Img src={o.content} style={{ ...style, width: o.position === 'top-left' ? 140 * (width / 1080) : '35%' }} />;
  return (
    <AbsoluteFill style={{ opacity: style.opacity }}>
      <OffthreadVideo src={o.content} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </AbsoluteFill>
  );
};
