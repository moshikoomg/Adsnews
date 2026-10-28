import { useEffect, useMemo, useRef, useState } from 'react';
import { fontCss, NICHE_PACKS } from '../../lib/presets';
import { groupLines } from '../../lib/captions';

const SIZE = { sm: 'text-sm', md: 'text-base', lg: 'text-2xl' };
const POS = { top: 'top-[14%]', center: 'top-1/2 -translate-y-1/2', bottom: 'bottom-[10%]' };

// תצוגה מקדימה חיה: וידאו + כתוביות קריוקי + אמוג'י לפי מילות מפתח + אפקט זום
export default function PreviewPlayer({ source, words, settings }) {
  const ref = useRef(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const { captions, brand, broll, transitions } = settings;

  useEffect(() => {
    let raf;
    const tick = () => {
      if (ref.current) setT(ref.current.currentTime);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const lines = useMemo(() => groupLines(words, captions.maxWordsPerLine), [words, captions.maxWordsPerLine]);
  const line = lines.find((l) => t >= l.start && t <= l.end + 0.15);
  const lineIdx = line ? lines.indexOf(line) : 0;

  const pack = NICHE_PACKS[brand.niche] ?? NICHE_PACKS.general;
  const pop = broll.autoKeywords
    ? words.find((w) => t >= w.start && t <= w.start + 1.2 && Object.keys(pack.keywords).some((k) => w.text.includes(k)))
    : null;
  const popEmoji = pop && Object.entries(pack.keywords).find(([k]) => pop.text.includes(k))?.[1];

  const zoom = transitions.jumpCuts && lineIdx % 2 === 1 ? 1 + 0.15 * transitions.intensity : 1;
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    v.paused ? v.play() : v.pause();
    setPlaying(!v.paused);
  };

  return (
    <div className="relative h-full aspect-[9/16] mx-auto overflow-hidden rounded-2xl bg-neutral-900" onClick={toggle}>
      <video
        ref={ref}
        src={source.url}
        autoPlay
        loop
        playsInline
        className={`w-full h-full object-cover transition-transform duration-300`}
        style={{ transform: `scale(${zoom}) ${source.origin === 'camera' ? 'scaleX(-1)' : ''}` }}
      />
      {!playing && <div className="absolute inset-0 flex items-center justify-center text-6xl text-white/80">▶</div>}

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
