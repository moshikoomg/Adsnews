import { useEffect, useRef, useState } from 'react';

const norm = (w) => w.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

/**
 * עוקב אחרי הדיבור (Web Speech API) ומחזיר את אינדקס המילה האחרונה שנאמרה בתסריט.
 * אם הדפדפן לא תומך – supported=false ונופלים לגלילה לפי קצב קבוע.
 */
export function useSpeechFollow(words, active, lang = 'he-IL') {
  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const [index, setIndex] = useState(-1);
  const [failed, setFailed] = useState(false);
  const pos = useRef(0);

  useEffect(() => {
    if (!SR || !active || failed) return;
    pos.current = 0;
    setIndex(-1);
    const r = new SR();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const heard = Array.from(e.results).map((x) => x[0].transcript).join(' ').split(/\s+/).map(norm).filter(Boolean);
      const last = heard.slice(-3);
      // חיפוש קדימה בחלון קטן מהמיקום הנוכחי
      for (let i = pos.current; i < Math.min(words.length, pos.current + 12); i++) {
        if (last.includes(norm(words[i]))) {
          pos.current = i + 1;
          setIndex(i);
        }
      }
    };
    r.onerror = () => setFailed(true); // אין רשת/הרשאה – נופלים לגלילה בקצב קבוע
    r.start();
    return () => r.abort();
  }, [SR, active, words, lang, failed]);

  return { supported: !!SR && !failed, index };
}
