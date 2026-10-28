import { useEffect, useRef, useState } from 'react';

// פותח מצלמה קדמית + מיקרופון ומחזיר stream ו-ref לווידאו
export function useCamera({ facingMode = 'user' } = {}) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let s;
    (async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1920 }, aspectRatio: { ideal: 9 / 16 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (!active) return s.getTracks().forEach((t) => t.stop());
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch (e) {
        setError(e.name === 'NotAllowedError' ? 'אין הרשאה למצלמה/מיקרופון' : 'לא ניתן לפתוח מצלמה');
      }
    })();
    return () => {
      active = false;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, [facingMode]);

  return { videoRef, stream, error };
}
