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

// זום חומרה של המצלמה (אם המכשיר תומך). מחזיר null כשאין תמיכה.
export function useCameraZoom(stream) {
  const [range, setRange] = useState(null);
  const [zoom, setZoomState] = useState(1);

  useEffect(() => {
    const track = stream?.getVideoTracks()[0];
    const caps = track?.getCapabilities?.();
    if (caps?.zoom) {
      setRange({ min: caps.zoom.min, max: Math.min(caps.zoom.max, caps.zoom.min * 5), step: caps.zoom.step || 0.1 });
      setZoomState(track.getSettings().zoom ?? caps.zoom.min);
    } else setRange(null);
  }, [stream]);

  const setZoom = (z) => {
    setZoomState(z);
    stream?.getVideoTracks()[0]?.applyConstraints({ advanced: [{ zoom: z }] }).catch(() => {});
  };
  return { range, zoom, setZoom };
}
