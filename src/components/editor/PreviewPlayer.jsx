import { useEffect, useMemo, useRef, useState } from 'react';
import { fontCss, NICHE_PACKS } from '../../lib/presets';
import { groupLines } from '../../lib/captions';
import { keepRanges, zoomFor } from '../../lib/renderJob';
import { useStudio } from '../../store/useStudio';

const SIZE = { sm: 'text-xl', md: 'text-2xl', lg: 'text-[34px]' };
const POS = { top: 'top-[16%]', center: 'top-1/2 -translate-y-1/2', bottom: 'bottom-[22%]' };
const SPOT = { top: 'top-[9%] inset-x-0 flex justify-center', 'top-right': 'top-[11%] right-6', 'top-left': 'top-[11%] left-6', center: 'top-[38%] inset-x-0 flex justify-center', bottom: 'bottom-[30%] inset-x-0 flex justify-center' };

// מיקום הניגון הנוכחי (לפיצול קטעים) בלי לרנדר מחדש את כל המסך בכל פריים
export const playhead = { t: 0 };

/**
 * תצוגה מקדימה חיה במסך מלא: מנגן רק את הקטעים שנשארו (בסדר שלהם),
 * ומציג את העריכה: כתוביות עם הדגשות, כותרת פתיחה, אלמנטים קופצים, זום ברגעים וקריאה לפעולה.
 */
export default function PreviewPlayer({ source, words, settings, onTap }) {
  const ref = useRef(null);
  const rangeIdx = useRef(0);
  const userPaused = useRef(false);
  const [t, setT] = useState(0);
  const [outT, setOutT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const seek = useStudio((s) => s.seek);
  const { captions, brand, broll, transitions, plan } = settings;
  const ranges = useMemo(() => keepRanges(source), [source]);
  const outDur = ranges.reduce((s, [a, b]) => s + b - a, 0);

  useEffect(() => {
    let raf;
    const tick = () => {
      const v = ref.current;
      if (v && ranges.length) {
        let i = rangeIdx.current;
        const inside = (k) => ranges[k] && v.currentTime >= ranges[k][0] - 0.05 && v.currentTime < ranges[k][1];
        if (!inside(i)) {
          const found = ranges.findIndex((_, k) => inside(k));
          if (found >= 0) i = found;
          else if (ranges[i] && v.currentTime >= ranges[i][1]) {
            i = (i + 1) % ranges.length;
            v.currentTime = ranges[i][0];
            if (!userPaused.current) v.play().catch(() => {});
          } else v.currentTime = ranges[i]?.[0] ?? ranges[0][0];
          rangeIdx.current = i;
        }
        playhead.t = v.currentTime;
        setT(v.currentTime);
        const before = ranges.slice(0, i).reduce((s, [a, b]) => s + b - a, 0);
        setOutT(before + Math.max(0, v.currentTime - ranges[i][0]));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ranges]);

  useEffect(() => {
    if (seek && ref.current) {
      ref.current.currentTime = seek.t;
      ref.current.play().catch(() => {});
      userPaused.current = false;
      setPlaying(true);
    }
  }, [seek]);

  const kept = useMemo(
    () => words.map((w, i) => ({ ...w, i })).filter((w) => ranges.some(([a, b]) => w.start >= a - 0.01 && w.start < b)),
    [words, ranges],
  );
  const lines = useMemo(() => groupLines(kept, captions.maxWordsPerLine), [kept, captions.maxWordsPerLine]);
  const line = lines.find((l) => t >= l.start && t <= l.end + 0.15);
  const lineIdx = line ? lines.indexOf(line) : 0;
  const emph = useMemo(() => new Set(plan?.emphasis ?? []), [plan]);

  // אלמנטים: מהתוכנית של הבמאי, או (בלי תוכנית) מילות מפתח לפי תחום
  const active = (plan?.moments ?? []).filter((m) => m.kind !== 'zoom' && t >= m.t && t <= m.end);
  const pack = NICHE_PACKS[brand.niche] ?? NICHE_PACKS.general;
  if (!plan && broll.autoKeywords) {
    const w = kept.find((x) => t >= x.start && t <= x.start + 1.2 && Object.keys(pack.keywords).some((k) => x.text.includes(k)));
    const e = w && Object.entries(pack.keywords).find(([k]) => w.text.includes(k))?.[1];
    if (e) active.push({ kind: 'emoji', t: w.start, value: e, position: 'top-left' });
  }

  const zoomMoment = (plan?.moments ?? []).find((m) => m.kind === 'zoom' && t >= m.t && t <= m.end);
  const zoom = zoomMoment ? zoomMoment.scale : plan ? 1 : zoomFor(lineIdx, transitions);
  const mirror = source.origin === 'camera' && source.mirrored !== false ? ' scaleX(-1)' : '';
  const font = fontCss(brand.font);
  const showHook = plan?.hook && outT <= plan.hook.end - plan.hook.start;
  const showCta = plan?.cta && outDur > 2 && outT >= outDur - 2.5;

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    userPaused.current = v.paused;
    setPlaying(!v.paused);
    onTap?.();
  };

  const wordStyle = (w, on) => {
    const isEmph = emph.has(w.i);
    const base = { color: on ? captions.highlightColor : captions.color };
    if (isEmph && captions.emphasisStyle === 'box') return { background: captions.highlightColor, color: '#fff', borderRadius: 10, padding: '0 .25em', transform: 'rotate(-2deg) scale(1.08)' };
    if (isEmph && captions.emphasisStyle === 'scale') return { color: captions.highlightColor, transform: 'scale(1.3)', display: 'inline-block' };
    if (isEmph) return { color: captions.highlightColor };
    return { ...base, transform: on ? 'scale(1.1)' : 'none' };
  };

  return (
    <div className="absolute inset-0 overflow-hidden bg-black" onClick={toggle}>
      <video
        ref={ref}
        src={source.url}
        autoPlay
        playsInline
        className="w-full h-full object-cover transition-transform duration-300 ease-out"
        style={{ transform: `scale(${zoom})${mirror}` }}
      />
      {!playing && <div className="absolute inset-0 flex items-center justify-center text-7xl text-white/70 pointer-events-none">▶</div>}
      {!ranges.length && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70 bg-black/60">כל הקטעים נמחקו</div>}

      {showHook && (
        <div className="absolute top-[10%] inset-x-6 flex justify-center pointer-events-none">
          <div className="animate-pop px-4 py-2 rounded-2xl text-center text-[28px] leading-tight font-extrabold shadow-xl" style={{ fontFamily: font, background: brand.accent, color: '#fff' }}>
            {plan.hook.text}
          </div>
        </div>
      )}

      {active.map((m, k) => (
        <div key={`${m.kind}${m.t}${k}`} className={`absolute pointer-events-none ${SPOT[m.position] ?? SPOT['top-right']}`}>
          {m.kind === 'emoji' ? (
            <span className="block text-6xl animate-pop drop-shadow-2xl">{m.value}</span>
          ) : (
            <span className="block animate-pop px-3 py-1 rounded-xl text-3xl font-extrabold -rotate-3 shadow-xl" style={{ fontFamily: font, background: '#fff', color: brand.accent }}>
              {m.value}
            </span>
          )}
        </div>
      ))}

      {brand.logoUrl && <img src={brand.logoUrl} alt="" className="absolute top-4 left-4 w-12 h-12 object-contain" />}

      {captions.enabled && line && !showHook && (
        <div className={`absolute inset-x-8 ${POS[captions.position]} text-center pointer-events-none`}>
          <p className={`${SIZE[captions.size]} font-extrabold leading-snug`} style={{ fontFamily: font, textShadow: '0 3px 14px rgba(0,0,0,.85)', WebkitTextStroke: '1px rgba(0,0,0,.5)' }}>
            {captions.mode === 'word'
              ? (() => {
                  const w = line.words.find((x) => t >= x.start && t <= x.end) ?? line.words[0];
                  return <span key={w.start} className="inline-block animate-pop" style={{ ...wordStyle(w, true) }}>{w.text}</span>;
                })()
              : line.words.map((w, i) => {
                  const on = captions.mode === 'karaoke' && t >= w.start && t <= w.end;
                  return <span key={i} className="inline-block mx-1 transition-all" style={wordStyle(w, on)}>{w.text}</span>;
                })}
          </p>
        </div>
      )}

      {showCta && (
        <div className="absolute bottom-[26%] inset-x-8 flex justify-center pointer-events-none">
          <div className="animate-pop px-5 py-3 rounded-full text-xl font-extrabold shadow-xl" style={{ fontFamily: font, background: '#fff', color: '#000' }}>
            {plan.cta.text}
          </div>
        </div>
      )}
    </div>
  );
}
