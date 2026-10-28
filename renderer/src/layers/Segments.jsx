import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { segLen } from '../timing.js';

// URL מלא (Supabase Storage) או שם קובץ מתיקיית public לבדיקות מקומיות
const resolveSrc = (u) => (/^(https?:|blob:|data:)/.test(u) ? u : staticFile(u));

// כל מקטע = Sequence שמנגן את טווח הזמן שלו מהמקור, עם זום Jump-cut ומעבר כניסה
export const Segments = ({ job }) => {
  const { fps } = useVideoConfig();
  const { segments, transitions } = job.timeline;

  return segments.map((seg, i) => {
    const from = Math.round(seg.outStart * fps);
    const dur = Math.max(1, Math.round(segLen(seg) * fps));
    const transition = transitions.find((t) => t.toSegment === i);
    return (
      <Sequence key={i} from={from} durationInFrames={dur} layout="none">
        <SegmentClip src={resolveSrc(job.source.url)} seg={seg} transition={transition} zooms={job.zooms ?? []} from={from} />
      </Sequence>
    );
  });
};

const SegmentClip = ({ src, seg, transition, zooms, from }) => {
  const frame = useCurrentFrame(); // יחסי לתחילת המקטע
  const { fps } = useVideoConfig();
  const tOut = (from + frame) / fps;
  const tFrames = Math.max(1, Math.round((transition?.durationSec ?? 0) * fps));
  const p = transition && transition.type !== 'cut' ? interpolate(frame, [0, tFrames], [0, 1], { extrapolateRight: 'clamp' }) : 1;
  const k = transition?.intensity ?? 0.5;

  let scale = (seg.zoom ?? 1) * punch(zooms, tOut);
  let opacity = 1;
  if (transition?.type === 'zoom-in') scale *= interpolate(p, [0, 1], [1 + 0.12 * k, 1]);
  if (transition?.type === 'zoom-out') scale *= interpolate(p, [0, 1], [1 - 0.08 * k, 1]);
  if (transition?.type === 'fade') opacity = p;

  return (
    <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
      <OffthreadVideo
        src={src}
        startFrom={Math.round(seg.srcStart * fps)}
        endAt={Math.round(seg.srcEnd * fps)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${scale})` }}
      />
    </AbsoluteFill>
  );
};

// זום ממוקד ברגע שהבמאי בחר: נכנס ויוצא בעדינות (0.25 שנ׳)
function punch(zooms, t) {
  const z = zooms.find((x) => t >= x.start - 0.25 && t <= x.end + 0.25);
  if (!z) return 1;
  const k = interpolate(t, [z.start - 0.25, z.start, z.end, z.end + 0.25], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return 1 + (z.scale - 1) * k;
}
