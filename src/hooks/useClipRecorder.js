import { useCallback, useEffect, useRef, useState } from 'react';

const pickMime = () =>
  ['video/mp4;codecs=avc1,mp4a', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(
    (m) => window.MediaRecorder?.isTypeSupported?.(m),
  ) ?? '';

const MIN_CLIP = 0.3;
const now = () => performance.now() / 1000;

/**
 * הקלטה בקטעים כמו בטיקטוק: MediaRecorder אחד שעובר בין pause ל-resume.
 * clips = [{ id, start, end }] בזמן הקובץ המוקלט. קטע שנמחק נשאר בקובץ אבל לא נכלל בעריכה.
 */
export function useClipRecorder(stream, { maxSec = 60, onComplete } = {}) {
  const rec = useRef(null);
  const chunks = useRef([]);
  const base = useRef(0); // זמן מוקלט שהצטבר עד ה-resume האחרון
  const t0 = useRef(0);
  const clipStart = useRef(0);
  const [recording, setRecording] = useState(false);
  const [clips, setClips] = useState([]);
  const [current, setCurrent] = useState(0); // אורך הקטע שמוקלט כרגע

  const fileTime = () => base.current + (rec.current?.state === 'recording' ? now() - t0.current : 0);
  const keptSec = clips.reduce((s, c) => s + (c.end - c.start), 0);

  const start = useCallback(() => {
    if (!stream || rec.current?.state === 'recording') return;
    if (!rec.current) {
      const mimeType = pickMime();
      const r = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.start(250);
      rec.current = r;
    } else {
      rec.current.resume();
    }
    t0.current = now();
    clipStart.current = base.current;
    setCurrent(0);
    setRecording(true);
    navigator.vibrate?.(20);
  }, [stream]);

  const pause = useCallback(() => {
    const r = rec.current;
    if (r?.state !== 'recording') return;
    r.pause();
    base.current += now() - t0.current;
    const clip = { id: crypto.randomUUID(), start: +clipStart.current.toFixed(3), end: +base.current.toFixed(3) };
    if (clip.end - clip.start >= MIN_CLIP) setClips((c) => [...c, clip]);
    setRecording(false);
    setCurrent(0);
  }, []);

  const deleteLast = useCallback(() => setClips((c) => c.slice(0, -1)), []);

  const finish = useCallback(() => {
    const r = rec.current;
    if (!r || !clips.length) return;
    if (r.state === 'recording') pause();
    const finalClips = clips;
    r.onstop = () => {
      const blob = new Blob(chunks.current, { type: r.mimeType || 'video/webm' });
      rec.current = null;
      base.current = 0;
      onComplete?.({ blob, clips: finalClips, mimeType: blob.type, durationSec: fileTime() });
    };
    r.stop();
  }, [clips, onComplete, pause]); // eslint-disable-line react-hooks/exhaustive-deps

  // טיימר + עצירה אוטומטית במגבלת הזמן
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const cur = now() - t0.current;
      setCurrent(cur);
      if (keptSec + cur >= maxSec) pause();
    }, 100);
    return () => clearInterval(id);
  }, [recording, keptSec, maxSec, pause]);

  useEffect(() => () => rec.current?.state !== 'inactive' && rec.current?.stop(), []);

  return { start, pause, finish, deleteLast, recording, clips, current, totalSec: keptSec + current, maxSec };
}
