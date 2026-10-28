import { useEffect, useMemo, useRef, useState } from 'react';
import { fontCss, NICHE_PACKS } from '../../lib/presets';
import { groupLines } from '../../lib/captions';
import { keepRanges, zoomFor } from '../../lib/renderJob';
import { useStudio } from '../../store/useStudio';

const SIZE = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
const POS = { top: 'top-[14%]', center: 'top-1/2 -translate-y-1/2', bottom: 'bottom-[10%]' };

// מיקום הניגון הנוכחי (לפיצול קטעים) בלי לרנדר מחדש את כל המסך בכל פריים
export const playhead = { t: 0 };

// תצוגה מקדימה חיה: מנגן רק את הקטעים שנשארו (בסדר שלהם), עם כתוביות, אמוג'י וזום
export default function PreviewPlayer({ source, words, settings }) {
  const ref = useRef(null);
  const rangeIdx = useRef(0);
  const userPaused = useRef(false);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const seek = useStudio((s) => s.seek);
  const { captions, brand, broll, transitions } = settings;
  const ranges = useMemo(() => keepRanges(source), [source]);

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
            // סוף הקטע: עוברים לקטע הבא (או חוזרים להתחלה)
            i = (i + 1) % ranges.length;
            v.currentTime = ranges[i][0];
            if (!userPaused.current) v.play().catch(() => {});
          } else v.currentTime = ranges[i]?.[0] ?? ranges[0][0];
          rangeIdx.current = i;
        }
        playhead.t = v.currentTime;
        setT(v.currentTime);
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

  const kept = useMemo(() => words.filter((w) => ranges.some(([a, b]) => w.start >= a - 0.01 && w.start < b)), [words, ranges]);
  const lines = useMemo(() => groupLines(kept, captions.maxWordsPerLine), [kept, captions.maxWordsPerLine]);
  const line = lines.find((l) => t >= l.start && t <= l.end + 0.15);
  const lineIdx = line ? lines.indexOf(line) : 0;

  const pack = NICHE_PACKS[brand.niche] ?? NICHE_PACKS.general;
  const pop = broll.autoKeywords
    ? kept.find((w) => t >= w.start && t <= w.start + 1.2 && Object.keys(pack.keywords).some((k) => w.text.includes(k)))
    : null;
  const popEmoji = pop && Object.entries(pack.keywords).find(([k]) => pop.text.includes(k))?.[1];

  const zoom = zoomFor(lineIdx, transitions);
  const mirror = source.origin === 'camera' ? ' scaleX(-1)' : '';
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    userPaused.current = v.paused;
    setPlaying(!v.paused);
  };

  return (
    <div className="relative h-full aspect-[9/16] max-w-full mx-auto overflow-hidden rounded-2xl bg-neutral-900" onClick={toggle}>
      <video
        ref={ref}
        src={source.url}
        autoPlay
        playsInline
        className="w-full h-full object-cover transition-transform duration-300"
        style={{ transform: `scale(${zoom})${mirror}` }}
      />
      {!playing && <div className="absolute inset-0 flex items-center justify-center text-6xl text-white/80">▶</div>}
      {!ranges.length && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70 bg-black/60">כל הקטעים נמחקו</div>}

      {popEmoji && <div key={pop.start} className="absolute top-[12%] left-6 text-4xl animate-pop drop-shadow-xl">{popEmoji}</div>}
      {brand.logoUrl && <img src={brand.logoUrl} alt="" className="absolute top-4 left-4 w-12 h-12 object-contain" />}

      {captions.enabled && line && (
        <div className={`absolute inset-x-6 ${POS[captions.position]} text-center pointer-events-none`}>
          <p className={`${SIZE[captions.size]} font-extrabold leading-snug`} style={{ fontFamily: fontCss(brand.font), textShadow: '0 3px 12px rgba(0,0,0,.8)', WebkitTextStroke: captions.size === 'lg' ? '1px rgba(0,0,0,.6)' : 0 }}>
            {captions.mode === 'word'
              ? (() => {
                  const w = line.words.find((x) => t >= x.start && t <= x.end) ?? line.words[0];
                  return <span key={w.start} className="inline-block animate-pop" style={{ color: captions.highlightColor }}>{w.text}</span>;
                })()
              : line.words.map((w, i) => {
                  const on = captions.mode === 'karaoke' && t >= w.start && t <= w.end;
                  return (
                    <span key={i} className="inline-block mx-1 transition-all" style={{ color: on ? captions.highlightColor : captions.color, transform: on ? 'scale(1.12)' : 'none' }}>
                      {w.text}
                    </span>
                  );
                })}
          </p>
        </div>
      )}
    </div>
  );
}
