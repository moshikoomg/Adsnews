import { useCallback, useEffect, useRef, useState } from 'react';

const pickMime = () =>
  ['video/mp4;codecs=avc1,mp4a', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(
    (m) => window.MediaRecorder?.isTypeSupported?.(m),
  ) ?? '';

/**
 * Hold-to-record: start() בלחיצה, stop() בשחרור. בסיום onComplete({ blob, durationSec, mimeType }).
 */
export function useHoldToRecord(stream, { maxSec = 60, onComplete } = {}) {
  const rec = useRef(null);
  const chunks = useRef([]);
  const t0 = useRef(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const stop = useCallback(() => {
    if (rec.current?.state === 'recording') rec.current.stop();
  }, []);

  const start = useCallback(() => {
    if (!stream || rec.current?.state === 'recording') return;
    const mimeType = pickMime();
    const r = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined);
    chunks.current = [];
    r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    r.onstop = () => {
      setRecording(false);
      const durationSec = (performance.now() - t0.current) / 1000;
      if (durationSec < 0.5) return; // לחיצה מקרית
      const blob = new Blob(chunks.current, { type: r.mimeType || 'video/webm' });
      onComplete?.({ blob, durationSec, mimeType: blob.type });
    };
    r.start(250);
    rec.current = r;
    t0.current = performance.now();
    setElapsed(0);
    setRecording(true);
    navigator.vibrate?.(30);
  }, [stream, onComplete]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const s = (performance.now() - t0.current) / 1000;
      setElapsed(s);
      if (s >= maxSec) stop();
    }, 100);
    return () => clearInterval(id);
  }, [recording, maxSec, stop]);

  return { start, stop, recording, elapsed };
}
