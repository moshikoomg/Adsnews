// קורא משך ומידות מקובץ וידאו
export function readVideoMeta(url) {
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      // ב-webm מ-MediaRecorder המשך לפעמים Infinity עד שקופצים לסוף
      if (v.duration === Infinity) {
        v.currentTime = 1e9;
        v.ontimeupdate = () => {
          v.ontimeupdate = null;
          resolve({ durationSec: v.duration, width: v.videoWidth, height: v.videoHeight });
        };
      } else resolve({ durationSec: v.duration, width: v.videoWidth, height: v.videoHeight });
    };
    v.onerror = () => resolve({ durationSec: 0 });
    v.src = url;
  });
}
