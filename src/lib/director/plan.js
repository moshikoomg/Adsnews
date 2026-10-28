// EditPlan – ההחלטות של "במאי ה-AI". אותו מבנה מגיע מ-Claude (Edge Function) או מהבמאי המקומי.
// {
//   summary: string,                       // הסבר קצר בעברית מה נעשה
//   style: { presetId, font, primary, secondary, accent },
//   captions: { enabled, mode, position, size, color, highlightColor, maxWordsPerLine, emphasisStyle },
//   hook: { text, start, end } | null,      // כותרת פתיחה גדולה
//   moments: [{ t, end, kind: 'zoom'|'emoji'|'text', value, scale?, position? }],
//   emphasis: number[],                     // אינדקסים של מילים מודגשות בתמלול
//   cuts: { removeSilences, silenceThresholdMs },
//   music: { track: 'none'|'upbeat'|'chill'|'corporate', volume },
//   transitions: { type, intensity },
//   cta: { text } | null,
// }

export const FONT_IDS = ['heebo', 'elegant', 'display', 'bones'];
export const EMPHASIS_STYLES = ['color', 'box', 'scale'];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const oneOf = (v, list, d) => (list.includes(v) ? v : d);
const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c);

// מנקה תוכנית שהגיעה מבחוץ (מודל) כדי שלא תשבור את התצוגה
export function sanitizePlan(p, durationSec, wordCount) {
  const d = durationSec || 60;
  const t = (x) => clamp(Number(x) || 0, 0, d);
  return {
    summary: String(p.summary ?? '').slice(0, 600),
    style: {
      presetId: p.style?.presetId ?? 'custom',
      font: oneOf(p.style?.font, FONT_IDS, 'display'),
      primary: isHex(p.style?.primary) ? p.style.primary : '#000000',
      secondary: isHex(p.style?.secondary) ? p.style.secondary : '#ffffff',
      accent: isHex(p.style?.accent) ? p.style.accent : '#fe2c55',
    },
    captions: {
      enabled: p.captions?.enabled !== false,
      mode: oneOf(p.captions?.mode, ['karaoke', 'word', 'sentence'], 'karaoke'),
      position: oneOf(p.captions?.position, ['top', 'center', 'bottom'], 'center'),
      size: oneOf(p.captions?.size, ['sm', 'md', 'lg'], 'lg'),
      color: isHex(p.captions?.color) ? p.captions.color : '#ffffff',
      highlightColor: isHex(p.captions?.highlightColor) ? p.captions.highlightColor : '#fe2c55',
      maxWordsPerLine: clamp(Math.round(p.captions?.maxWordsPerLine ?? 3), 1, 8),
      emphasisStyle: oneOf(p.captions?.emphasisStyle, EMPHASIS_STYLES, 'box'),
    },
    hook: p.hook?.text ? { text: String(p.hook.text).slice(0, 60), start: t(p.hook.start), end: t(p.hook.end ?? 2.5) || 2.5 } : null,
    moments: (Array.isArray(p.moments) ? p.moments : [])
      .filter((m) => ['zoom', 'emoji', 'text'].includes(m?.kind))
      .slice(0, 40)
      .map((m) => ({
        kind: m.kind,
        t: t(m.t),
        end: Math.max(t(m.t) + 0.3, t(m.end ?? m.t + 1.2)),
        value: String(m.value ?? '').slice(0, 40),
        scale: m.kind === 'zoom' ? clamp(Number(m.scale) || 1.1, 1.02, 1.35) : undefined,
        position: oneOf(m.position, ['top', 'center', 'bottom', 'top-right', 'top-left'], m.kind === 'emoji' ? 'top-right' : 'top'),
      })),
    emphasis: (Array.isArray(p.emphasis) ? p.emphasis : []).filter((i) => Number.isInteger(i) && i >= 0 && i < wordCount),
    cuts: { removeSilences: p.cuts?.removeSilences !== false, silenceThresholdMs: clamp(Number(p.cuts?.silenceThresholdMs) || 600, 200, 2000) },
    music: { track: oneOf(p.music?.track, ['none', 'upbeat', 'chill', 'corporate'], 'none'), volume: clamp(Number(p.music?.volume) || 0.2, 0, 0.6) },
    transitions: { type: oneOf(p.transitions?.type, ['cut', 'zoom-in', 'zoom-out', 'fade'], 'cut'), intensity: clamp(Number(p.transitions?.intensity) || 0.4, 0, 1) },
    cta: p.cta?.text ? { text: String(p.cta.text).slice(0, 60) } : null,
  };
}

// הופך תוכנית להגדרות העורך (כדי שאפשר יהיה להמשיך לכוונן ידנית)
export function planToSettings(plan, settings) {
  return {
    ...settings,
    presetId: plan.style.presetId,
    brand: { ...settings.brand, font: plan.style.font, primary: plan.style.primary, secondary: plan.style.secondary, accent: plan.style.accent },
    captions: { ...settings.captions, ...plan.captions },
    transitions: { ...settings.transitions, type: plan.transitions.type, intensity: plan.transitions.intensity, jumpCuts: false },
    audio: { ...settings.audio, removeSilences: plan.cuts.removeSilences, silenceThresholdMs: plan.cuts.silenceThresholdMs, music: plan.music.track, musicVolume: plan.music.volume },
    broll: { ...settings.broll, autoKeywords: false }, // האלמנטים מגיעים מהתוכנית
    plan: { hook: plan.hook, moments: plan.moments, emphasis: plan.emphasis, cta: plan.cta, summary: plan.summary },
  };
}
