import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpeechFollow } from '../../hooks/useSpeechFollow';

/**
 * טלפרומפטר צף. מצב "תסריט" (טקסט מלא) או "נקודות" (שורה לכל נקודה).
 * גלילה: לפי זיהוי דיבור (אם נתמך) או לפי קצב מילים לדקה.
 */
export default function Teleprompter({ script, recording, mode, wpm, fontSize }) {
  const words = useMemo(() => script.split(/\s+/).filter(Boolean), [script]);
  const lines = useMemo(() => script.split('\n').filter((l) => l.trim()), [script]);
  const box = useRef(null);
  const wordRefs = useRef([]);
  const [timedIndex, setTimedIndex] = useState(-1);
  const { supported, index: spokenIndex } = useSpeechFollow(words, recording && mode === 'script');

  // גלילה לפי קצב כאשר אין זיהוי דיבור
  useEffect(() => {
    if (!recording || supported) return;
    setTimedIndex(-1);
    const id = setInterval(() => setTimedIndex((i) => Math.min(i + 1, words.length - 1)), 60000 / wpm);
    return () => clearInterval(id);
  }, [recording, supported, wpm, words.length]);

  const current = supported ? spokenIndex : timedIndex;

  useEffect(() => {
    const el = wordRefs.current[Math.max(current, 0)];
    if (el && box.current) box.current.scrollTo({ top: el.offsetTop - box.current.clientHeight * 0.3, behavior: 'smooth' });
  }, [current]);

  useEffect(() => {
    if (!recording && box.current) box.current.scrollTo({ top: 0 });
  }, [recording]);

  return (
    <div
      ref={box}
      className="absolute top-20 inset-x-4 h-[34%] overflow-y-auto no-scrollbar rounded-2xl bg-black/45 backdrop-blur-sm px-4 py-3 z-10 text-center leading-relaxed font-semibold"
      style={{ fontSize, maskImage: 'linear-gradient(transparent, black 15%, black 85%, transparent)' }}
    >
      {mode === 'script' ? (
        <p>
          {words.map((w, i) => (
            <span key={i} ref={(el) => (wordRefs.current[i] = el)} className={`transition-colors ${i <= current ? 'text-white/35' : i === current + 1 ? 'text-yellow-300' : 'text-white'}`}>
              {w}{' '}
            </span>
          ))}
        </p>
      ) : (
        <ul className="text-right space-y-2">
          {lines.map((l, i) => (
            <li key={i} ref={(el) => (wordRefs.current[i] = el)} className="flex gap-2">
              <span className="text-pink-400">•</span>
              {l}
            </li>
          ))}
        </ul>
      )}
      <div className="h-[60%]" />
      {recording && <div className="absolute bottom-1 left-2 text-[10px] text-white/50">{supported ? '🎙️ עוקב אחרי הדיבור' : `⏱️ ${wpm} מילים/דקה`}</div>}
    </div>
  );
}
