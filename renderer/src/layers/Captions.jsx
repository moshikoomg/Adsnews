import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

const SIZE = { sm: 56, md: 72, lg: 96 };
const POS = { top: { justifyContent: 'flex-start', paddingTop: '16%' }, center: { justifyContent: 'center' }, bottom: { justifyContent: 'flex-end', paddingBottom: '18%' } };

// כתוביות: karaoke = שורה עם הדגשת המילה הנוכחית, word = מילה בודדת קופצת, sentence = שורה סטטית
export const Captions = ({ captions, brand }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  if (t < (captions.hideUntil ?? 0)) return null;
  const line = captions.lines.find((l) => t >= l.start && t <= l.end + 0.15);
  if (!line) return null;

  const scaleK = width / 1080;
  const fontSize = SIZE[captions.size] * scaleK;
  const base = {
    fontFamily: captions.fontFamily,
    fontSize,
    fontWeight: 800,
    lineHeight: 1.25,
    textAlign: 'center',
    direction: 'rtl',
    WebkitTextStroke: `${3 * scaleK}px rgba(0,0,0,.7)`,
    paintOrder: 'stroke fill',
    textShadow: `0 ${6 * scaleK}px ${24 * scaleK}px rgba(0,0,0,.6)`,
  };

  const lineIn = spring({ frame: frame - Math.round(line.start * fps), fps, config: { damping: 14, stiffness: 180 } });

  let content;
  if (captions.mode === 'word') {
    const w = line.words.find((x) => t >= x.start && t <= x.end) ?? line.words[line.words.length - 1];
    const s = spring({ frame: frame - Math.round(w.start * fps), fps, config: { damping: 10, stiffness: 220 } });
    content = <span style={{ display: 'inline-block', ...wordStyle(w, true, captions, scaleK), transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})` }}>{w.text}</span>;
  } else {
    content = line.words.map((w, i) => {
      const on = captions.mode === 'karaoke' && t >= w.start && t <= w.end;
      return (
        <span key={i} style={{ display: 'inline-block', margin: `0 ${12 * scaleK}px`, ...wordStyle(w, on, captions, scaleK) }}>
          {w.text}
        </span>
      );
    });
  }

  return (
    <AbsoluteFill style={{ alignItems: 'center', padding: `0 ${70 * scaleK}px`, ...POS[captions.position] }}>
      <div style={{ ...base, transform: `translateY(${interpolate(lineIn, [0, 1], [30 * scaleK, 0])}px)`, opacity: lineIn, accentColor: brand.accent }}>{content}</div>
    </AbsoluteFill>
  );
};

// מילה מודגשת (מספר, מחיר, מילת מפתח): רקע צבעוני / הגדלה / צבע – לפי captions.emphasisStyle
function wordStyle(w, on, captions, k) {
  if (w.emphasis && captions.emphasisStyle === 'box')
    return { background: captions.highlightColor, color: '#fff', borderRadius: 18 * k, padding: `0 ${14 * k}px`, transform: 'rotate(-2deg) scale(1.08)', WebkitTextStroke: 0 };
  if (w.emphasis && captions.emphasisStyle === 'scale') return { color: captions.highlightColor, transform: 'scale(1.3)' };
  if (w.emphasis) return { color: captions.highlightColor };
  return { color: on ? captions.highlightColor : captions.color, transform: on ? 'scale(1.12)' : 'none' };
}
