// דוגם פריימים מסרטון (לניתוח סגנון ולשליחה למודל). מחזיר [{ t, dataUrl, data: ImageData }]
export async function sampleFrames(url, { count = 8, width = 180 } = {}) {
  const v = document.createElement('video');
  v.muted = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.src = url;
  await new Promise((res, rej) => {
    v.onloadeddata = res;
    v.onerror = rej;
  });
  let dur = v.duration;
  if (!isFinite(dur)) {
    v.currentTime = 1e9;
    await new Promise((r) => (v.ontimeupdate = r));
    dur = v.duration;
  }
  const h = Math.round((width * (v.videoHeight || 16)) / (v.videoWidth || 9));
  const canvas = Object.assign(document.createElement('canvas'), { width, height: h });
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const frames = [];
  for (let i = 0; i < count; i++) {
    const t = ((i + 0.5) / count) * dur;
    v.currentTime = t;
    await new Promise((r) => (v.onseeked = r));
    ctx.drawImage(v, 0, 0, width, h);
    frames.push({ t, dataUrl: canvas.toDataURL('image/jpeg', 0.7), data: ctx.getImageData(0, 0, width, h) });
  }
  return { frames, durationSec: dur, width: v.videoWidth, height: v.videoHeight };
}

const hex = (r, g, b) => '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');

// ניתוח מקומי של סגנון: פלטת צבעים דומיננטית, בהירות, וקצב החלפת סצנות
export function analyzeFrames(frames, durationSec) {
  const buckets = new Map();
  let lum = 0;
  let n = 0;
  const diffs = [];
  let prev = null;
  for (const { data } of frames) {
    const px = data.data;
    const small = [];
    for (let i = 0; i < px.length; i += 16 * 4) {
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
      lum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
      n++;
      small.push(r, g, b);
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      if (max - min < 40) continue; // מדלגים על אפורים – מחפשים צבעי מותג
      const key = [r >> 5, g >> 5, b >> 5].join(',');
      const bkt = buckets.get(key) ?? { r: 0, g: 0, b: 0, c: 0 };
      bkt.r += r; bkt.g += g; bkt.b += b; bkt.c++;
      buckets.set(key, bkt);
    }
    if (prev) {
      let d = 0;
      for (let i = 0; i < small.length; i++) d += Math.abs(small[i] - prev[i]);
      diffs.push(d / small.length);
    }
    prev = small;
  }
  const palette = [...buckets.values()].sort((a, b) => b.c - a.c).slice(0, 3).map((b) => hex(b.r / b.c, b.g / b.c, b.b / b.c));
  const brightness = lum / n / 255;
  const sceneChanges = diffs.filter((d) => d > 35).length;
  const changesPerSec = durationSec ? sceneChanges / durationSec : 0;
  const pace = changesPerSec > 0.25 || sceneChanges >= frames.length / 2 ? 'fast' : changesPerSec > 0.08 ? 'medium' : 'slow';
  return { palette, brightness: +brightness.toFixed(2), pace, sceneChanges };
}
