import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * פותח את המצלמה כמו אפליקציית המצלמה של הטלפון:
 * - resizeMode 'none': בלי חיתוך והגדלה של הדפדפן (זה מה שגרם ל"זום")
 * - בלי לכפות יחס 9:16 – מקבלים את הפריים המלא של העדשה הרגילה
 * - אחרי הפתיחה מאפסים זום חומרה לערך הכי רחב
 * - אפשר להחליף בין קדמית/אחורית ובין עדשות (deviceId)
 */
export function useCamera() {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [facing, setFacing] = useState('user');
  const [deviceId, setDeviceId] = useState(null);
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    let active = true;
    let s;
    (async () => {
      try {
        const video = deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: facing } };
        s = await navigator.mediaDevices.getUserMedia({
          video: { ...video, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, resizeMode: 'none' },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (!active) return s.getTracks().forEach((t) => t.stop());
        const track = s.getVideoTracks()[0];
        const caps = track.getCapabilities?.();
        if (caps?.zoom) await track.applyConstraints({ advanced: [{ zoom: caps.zoom.min }] }).catch(() => {});
        setStream(s);
        setError(null);
        if (videoRef.current) videoRef.current.srcObject = s;
        const list = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
        if (active) setDevices(list);
      } catch (e) {
        setError(e.name === 'NotAllowedError' ? 'אין הרשאה למצלמה/מיקרופון' : 'לא ניתן לפתוח מצלמה');
      }
    })();
    return () => {
      active = false;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, [facing, deviceId]);

  const flip = useCallback(() => {
    setDeviceId(null);
    setFacing((f) => (f === 'user' ? 'environment' : 'user'));
  }, []);

  // מעבר לעדשה הבאה (בטלפונים עם כמה מצלמות)
  const nextLens = useCallback(() => {
    if (devices.length < 2) return;
    const current = stream?.getVideoTracks()[0]?.getSettings().deviceId;
    const i = devices.findIndex((d) => d.deviceId === current);
    setDeviceId(devices[(i + 1) % devices.length].deviceId);
  }, [devices, stream]);

  const settings = stream?.getVideoTracks()[0]?.getSettings();
  const mirrored = (settings?.facingMode ?? facing) !== 'environment';

  return { videoRef, stream, error, flip, nextLens, lensCount: devices.length, mirrored, settings };
}

// זום חומרה של המצלמה (אם המכשיר תומך). מחזיר range=null כשאין תמיכה.
export function useCameraZoom(stream) {
  const [range, setRange] = useState(null);
  const [zoom, setZoomState] = useState(1);

  useEffect(() => {
    const track = stream?.getVideoTracks()[0];
    const caps = track?.getCapabilities?.();
    if (caps?.zoom && caps.zoom.max > caps.zoom.min) {
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
