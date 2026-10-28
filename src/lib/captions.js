import { supabase } from './supabase';

// מחזיר מערך מילים עם זמנים: [{ text, start, end }] (שניות)
export async function transcribe({ blob, durationSec, fallbackText }) {
  if (supabase && blob) {
    try {
      const form = new FormData();
      form.append('file', blob, 'clip.webm');
      const { data, error } = await supabase.functions.invoke('transcribe', { body: form });
      if (!error && data?.words?.length) return data.words;
    } catch (e) {
      console.warn('transcribe failed, using fallback', e);
    }
  }
  return mockWords(fallbackText, durationSec);
}

// תמלול דמה: פורס את טקסט הטלפרומפטר על פני משך הסרטון
function mockWords(text, durationSec = 10) {
  const words = (text || 'כאן יופיעו הכתוביות האוטומטיות של הסרטון שלך מילה אחרי מילה')
    .split(/\s+/)
    .filter(Boolean);
  const dur = Math.max(durationSec || 0, words.length * 0.25);
  const step = dur / words.length;
  return words.map((w, i) => ({ text: w, start: +(i * step).toFixed(2), end: +((i + 1) * step).toFixed(2) }));
}

export { groupLines } from './renderJob';
