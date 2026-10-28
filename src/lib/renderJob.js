// לוגיקה טהורה (בלי תלות ב-Supabase / דפדפן) – משותפת ל-Frontend ולשירות הרינדור
import { NICHE_PACKS, fontCss } from './presets.js';

// מחלק מילים לשורות כתוביות
export function groupLines(words, maxWords = 4) {
  const lines = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const chunk = words.slice(i, i + maxWords);
    lines.push({ start: chunk[0].start, end: chunk[chunk.length - 1].end, words: chunk });
  }
  return lines;
}

export const RENDER_SCHEMA_VERSION = '1.0.0';

/**
 * בונה את פקודת הרינדור (JSON) מחומר הגלם + ההגדרות.
 * הפלט תואם ל-render-job.schema.json ונקרא ע"י Remotion / FFmpeg ב-Backend.
 */
export function buildRenderJob({ source, words, settings, publishTargets = [], projectId }) {
  const duration = source.durationSec || words.at(-1)?.end || 0;
  const segments = buildSegments(words, duration, settings);
  const pack = NICHE_PACKS[settings.brand.niche] ?? NICHE_PACKS.general;

  return {
    schemaVersion: RENDER_SCHEMA_VERSION,
    jobId: crypto.randomUUID(),
    projectId: projectId ?? null,
    createdAt: new Date().toISOString(),
    source: {
      url: source.remoteUrl ?? null, // ימולא אחרי העלאה ל-Storage
      origin: source.origin, // 'camera' | 'upload'
      mimeType: source.mimeType,
      durationSec: +duration.toFixed(2),
      width: source.width ?? null,
      height: source.height ?? null,
    },
    output: { ...settings.output, format: 'mp4', codec: 'h264' },
    style: {
      presetId: settings.presetId,
      brand: { ...settings.brand, fontFamily: fontCss(settings.brand.font) },
    },
    timeline: {
      segments,
      transitions: segments.slice(1).map((seg, i) => ({
        at: seg.outStart,
        fromSegment: i,
        toSegment: i + 1,
        type: settings.transitions.type,
        durationSec: settings.transitions.type === 'cut' ? 0 : 0.3,
        intensity: settings.transitions.intensity,
      })),
    },
    captions: settings.captions.enabled
      ? {
          ...settings.captions,
          fontFamily: fontCss(settings.brand.font),
          words: remapWords(words, segments),
          lines: groupLines(remapWords(words, segments), settings.captions.maxWordsPerLine),
        }
      : null,
    overlays: buildOverlays(words, segments, settings, pack),
    audio: {
      music: settings.audio.music === 'none' ? null : { track: settings.audio.music, volume: settings.audio.musicVolume, ducking: true },
      normalize: true,
    },
    ai: {
      customPrompt: settings.customPrompt?.trim() || null, // מועבר ל-LLM שמתרגם לפעולות עריכה נוספות
    },
    publish: { targets: publishTargets },
  };
}

// חיתוך שתיקות: כל רווח בין מילים מעל הסף הופך לחיתוך. אם כבוי – מקטע אחד.
function buildSegments(words, duration, settings) {
  const { removeSilences, silenceThresholdMs } = settings.audio;
  if (!removeSilences || words.length === 0) {
    return [{ index: 0, srcStart: 0, srcEnd: +duration.toFixed(2), outStart: 0, zoom: 1 }];
  }
  const gap = silenceThresholdMs / 1000;
  const pad = 0.12;
  const raw = [];
  let start = Math.max(0, words[0].start - pad);
  for (let i = 1; i < words.length; i++) {
    if (words[i].start - words[i - 1].end > gap) {
      raw.push([start, words[i - 1].end + pad]);
      start = words[i].start - pad;
    }
  }
  raw.push([start, Math.min(duration || Infinity, words.at(-1).end + pad)]);

  let out = 0;
  return raw.map(([s, e], index) => {
    const seg = {
      index,
      srcStart: +s.toFixed(2),
      srcEnd: +e.toFixed(2),
      outStart: +out.toFixed(2),
      // Jump-cuts: זום מתחלף בין מקטעים לתחושת דינמיות
      zoom: settings.transitions.jumpCuts && index % 2 === 1 ? 1 + 0.15 * settings.transitions.intensity : 1,
    };
    out += e - s;
    return seg;
  });
}

// מתרגם זמני מילים מזמן המקור לזמן הפלט (אחרי חיתוכים)
function remapWords(words, segments) {
  return words
    .map((w) => {
      const seg = segments.find((s) => w.start >= s.srcStart - 0.001 && w.start <= s.srcEnd);
      if (!seg) return null;
      const shift = seg.outStart - seg.srcStart;
      return { text: w.text, start: +(w.start + shift).toFixed(2), end: +(w.end + shift).toFixed(2) };
    })
    .filter(Boolean);
}

function buildOverlays(words, segments, settings, pack) {
  const overlays = [];
  const out = remapWords(words, segments);
  const clean = (t) => t.replace(/[.,!?"׳״]/g, '');

  if (settings.broll.autoKeywords) {
    for (const w of out) {
      const hit = Object.entries(pack.keywords).find(([k]) => clean(w.text).includes(k));
      if (hit) overlays.push({ kind: 'emoji', content: hit[1], keyword: hit[0], start: w.start, end: w.start + 1.2, animation: 'pop', position: 'top-right' });
    }
  }
  for (const item of settings.broll.items) {
    const w = out.find((x) => clean(x.text).includes(item.keyword));
    if (w) overlays.push({ kind: item.kind, content: item.src, keyword: item.keyword, start: w.start, end: w.start + 2, animation: 'fade', position: item.kind === 'video' ? 'fullscreen' : 'top-right' });
  }
  if (settings.brand.logoUrl) {
    overlays.push({ kind: 'image', content: settings.brand.logoUrl, start: 0, end: null, position: 'top-left', opacity: 0.9 });
  }
  return overlays;
}
