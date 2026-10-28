// במאי מקומי: מייצר EditPlan מתמלול + בקשה חופשית + ניתוח השראה, בלי שרת.
// כשיש Supabase, Claude עושה את זה טוב יותר (ראה index.js), וזה משמש גיבוי.
import { NICHE_PACKS } from '../presets.js';
import { sanitizePlan } from './plan.js';

const EMOJI = {
  מבצע: '🔥', הנחה: '💸', אחוז: '💸', חינם: '🎁', מתנה: '🎁', חדש: '✨', חדשה: '✨', היום: '📅', עכשיו: '⏰', זמן: '⏰',
  כסף: '💰', מחיר: '💰', שקל: '💰', כסף_: '💰', בית: '🏠', דירה: '🏠', אוכל: '🍕', טעים: '😋', קפה: '☕', לב: '❤️', אוהב: '❤️',
  אוהבים: '❤️', טלפון: '📱', הודעה: '💬', וואטסאפ: '💬', שאלה: '❓', למה: '🤔', סוד: '🤫', טיפ: '💡', רעיון: '💡', הכי: '🏆',
  מקום: '📍', משלוח: '🛵', שיניים: '🦷', חיוך: '😁', עצם: '🦴', גב: '🦴', כאב: '⚡', יופי: '💄', שיער: '💇', כושר: '💪', חזק: '💪',
  מהר: '⚡', בואו: '👇', תבואו: '👇', לינק: '🔗', קישור: '🔗', הצלחה: '🚀', לקוחות: '🤝', תודה: '🙏', וואו: '🤯', טוב: '👍',
};
const EMPHASIS = ['מבצע', 'הנחה', 'חינם', 'חדש', 'הכי', 'רק', 'מיוחד', 'בלעדי', 'היום', 'עכשיו', 'אחוז', 'מתנה', 'סוד', 'טיפ', 'אסור', 'חובה', 'לא', 'מדהים', 'ענק'];
const COLORS = {
  אדום: '#ff2d55', ורוד: '#ff4fa3', כחול: '#2f80ff', תכלת: '#38bdf8', ירוק: '#22c55e', צהוב: '#fde047', זהב: '#d4a64a',
  כתום: '#ff8a00', סגול: '#8b5cf6', לבן: '#ffffff', שחור: '#000000', טורקיז: '#14b8a6',
};

const clean = (w) => w.replace(/[.,!?"׳״:;()\-–]/g, '');
const has = (txt, ...keys) => keys.some((k) => txt.includes(k));
const isNumberish = (w) => /\d/.test(w) || /₪|%|שקל|אחוז/.test(w);

// מפרק את הבקשה החופשית לכוונות
export function parsePrompt(raw = '') {
  const p = raw.toLowerCase();
  const color = Object.entries(COLORS).find(([k]) => p.includes(k))?.[1];
  return {
    font: has(p, 'עצמות', 'bones', 'קריאייטיב', 'מצויר') ? 'bones' : has(p, 'אלגנט', 'יוקרת', 'עסקי') ? 'elegant' : has(p, 'בולט', 'עבה', 'חזק') ? 'display' : has(p, 'נקי', 'פשוט') ? 'heebo' : null,
    vibe: has(p, 'אלגנט', 'יוקרת', 'עסקי', 'רציני') ? 'elegant' : has(p, 'פופ', 'צבעוני', 'קריאייטיב', 'כיף') ? 'pop' : has(p, 'רגוע', 'עדין', 'שקט') ? 'calm' : has(p, 'אנרגטי', 'טיקטוק', 'קצבי', 'דינמי', 'ויראלי') ? 'energetic' : null,
    color,
    size: has(p, 'טקסט גדול', 'כתוביות גדולות', 'גדול יותר', 'תגדיל') ? 'lg' : has(p, 'טקסט קטן', 'כתוביות קטנות', 'קטן יותר', 'תקטין') ? 'sm' : null,
    position: has(p, 'למטה', 'תחתון', 'בתחתית') ? 'bottom' : has(p, 'למעלה', 'עליון') ? 'top' : has(p, 'באמצע', 'במרכז') ? 'center' : null,
    mode: has(p, 'מילה מילה', 'מילה אחרי מילה', 'מילה בודדת') ? 'word' : has(p, 'קריוקי') ? 'karaoke' : has(p, 'משפט שלם', 'משפטים') ? 'sentence' : null,
    noCaptions: has(p, 'בלי כתוביות', 'ללא כתוביות'),
    silences: has(p, 'שתיקות', 'שקט', 'הפסקות', 'חתוך') ? true : has(p, 'אל תחתוך', 'בלי חיתוך') ? false : null,
    music: has(p, 'בלי מוזיקה', 'ללא מוזיקה') ? 'none' : has(p, 'קצבית', 'אנרגטית', 'מקפיצה') ? 'upbeat' : has(p, 'מוזיקה רגועה', 'רגועה') ? 'chill' : has(p, 'מוזיקה עסקית', 'רקע עסקי') ? 'corporate' : has(p, 'מוזיקה') ? 'upbeat' : null,
    zoom: has(p, 'בלי זום', 'ללא זום', 'אין זום') ? 0 : has(p, 'פחות זום', 'זום עדין', 'קצת זום') ? 0.5 : has(p, 'הרבה זום', 'יותר זום') ? 1.6 : 1,
    emoji: has(p, 'בלי אימוג', 'ללא אימוג', 'בלי אייקונים') ? 0 : has(p, 'הרבה אימוג', 'יותר אימוג', 'אייקונים', 'אלמנטים') ? 1.6 : 1,
    hook: has(p, 'בלי כותרת') ? false : true,
    cta: has(p, 'קריאה לפעולה', 'בסוף', 'cta', 'שיתקשרו', 'שישלחו'),
    box: has(p, 'רקע לטקסט', 'מסגרת', 'בועה') ? true : null,
    raw,
  };
}

// מחלק תמלול למשפטים לפי פיסוק או הפסקה
function sentences(words) {
  const out = [];
  let cur = [];
  words.forEach((w, i) => {
    cur.push({ ...w, i });
    const next = words[i + 1];
    if (/[.!?]$/.test(w.text) || !next || next.start - w.end > 0.45 || cur.length >= 9) {
      out.push(cur);
      cur = [];
    }
  });
  return out;
}

const VIBES = {
  energetic: { font: 'display', primary: '#000000', secondary: '#ffffff', accent: '#fe2c55', mode: 'word', size: 'lg', position: 'center', emph: 'box', transition: 'cut', music: 'upbeat', zoomGap: 3.5 },
  pop: { font: 'bones', primary: '#7c3aed', secondary: '#fde047', accent: '#22d3ee', mode: 'karaoke', size: 'lg', position: 'center', emph: 'scale', transition: 'zoom-out', music: 'upbeat', zoomGap: 4 },
  elegant: { font: 'elegant', primary: '#111111', secondary: '#f5f1e8', accent: '#c9a45c', mode: 'sentence', size: 'md', position: 'bottom', emph: 'color', transition: 'fade', music: 'corporate', zoomGap: 7 },
  calm: { font: 'heebo', primary: '#0f172a', secondary: '#ffffff', accent: '#38bdf8', mode: 'karaoke', size: 'md', position: 'bottom', emph: 'color', transition: 'fade', music: 'chill', zoomGap: 8 },
};

// כמה בקשות ברצף (בקשה ראשונה + תיקונים בצ'אט): בקשה מאוחרת גוברת
function mergeWants(prompts) {
  const list = (Array.isArray(prompts) ? prompts : [prompts]).filter(Boolean).map(parsePrompt);
  const base = parsePrompt('');
  for (const w of list) for (const [k, v] of Object.entries(w)) {
    if (k === 'raw') continue;
    if (['zoom', 'emoji'].includes(k)) { if (v !== 1) base[k] = v; }
    else if (k === 'hook') { if (v === false) base.hook = false; }
    else if (v !== null && v !== false) base[k] = v;
  }
  return base;
}

export function localDirector({ words, durationSec, prompt, inspiration, niche = 'general', defaults }) {
  const want = mergeWants(prompt);
  const fromInsp = inspiration?.pace === 'fast' ? 'energetic' : inspiration?.pace === 'slow' ? 'calm' : null;
  const vibeId = want.vibe ?? fromInsp ?? defaults?.vibe ?? 'energetic';
  const vibe = VIBES[vibeId];
  const accent = want.color ?? inspiration?.palette?.[0] ?? vibe.accent;
  const notes = [];

  const sents = sentences(words);
  const pack = NICHE_PACKS[niche]?.keywords ?? {};
  const emojiDict = { ...EMOJI, ...pack };

  // הדגשות: מספרים/מחירים, מילות מכירה, מילות מפתח של התחום – לכל היותר אחת למשפט
  const emphasis = [];
  for (const s of sents) {
    const pick = s.find((w) => isNumberish(w.text)) ?? s.find((w) => EMPHASIS.some((k) => clean(w.text).includes(k))) ?? s.find((w) => Object.keys(pack).some((k) => clean(w.text).includes(k)));
    if (pick) emphasis.push(pick.i);
  }

  const moments = [];
  // זום: רק על רגעי הדגשה, עם מרווח מינימלי – לא באופן קבוע
  if (want.zoom > 0) {
    const gap = vibe.zoomGap / want.zoom;
    let last = -Infinity;
    for (const i of emphasis) {
      const w = words[i];
      if (w.start - last < gap) continue;
      moments.push({ kind: 'zoom', t: Math.max(0, w.start - 0.1), end: w.end + 0.6, scale: vibeId === 'elegant' || vibeId === 'calm' ? 1.06 : 1.12 });
      last = w.start;
    }
  }
  // אימוג'י שקופצים על מילות מפתח
  if (want.emoji > 0) {
    let last = -Infinity;
    const gap = 2.2 / want.emoji;
    for (const w of words) {
      const hit = Object.entries(emojiDict).find(([k]) => clean(w.text).includes(k.replace('_', '')));
      if (hit && w.start - last > gap) {
        moments.push({ kind: 'emoji', t: w.start, end: w.start + 1.3, value: hit[1], position: moments.length % 2 ? 'top-left' : 'top-right' });
        last = w.start;
      }
    }
  }
  // מספרים ומחירים כמדבקת טקסט גדולה
  for (const i of emphasis) {
    const w = words[i];
    if (isNumberish(w.text)) moments.push({ kind: 'text', t: w.start, end: w.start + 1.6, value: clean(w.text) + (words[i + 1] && /₪|%|שקל|אחוז|הנחה/.test(words[i + 1].text) ? ' ' + clean(words[i + 1].text) : ''), position: 'top' });
  }

  // כותרת פתיחה: המשפט הראשון, מקוצר
  const first = sents[0]?.map((w) => clean(w.text)).filter(Boolean) ?? [];
  const hook = want.hook && first.length ? { text: first.slice(0, 6).join(' '), start: 0, end: Math.min(2.8, (sents[0].at(-1)?.end ?? 2) + 0.4) } : null;

  // קריאה לפעולה בסוף
  const lastSent = sents.at(-1)?.map((w) => clean(w.text)).join(' ') ?? '';
  const ctaText = want.cta || /בואו|תבואו|התקשרו|שלחו|הזמינו|לינק|קישור/.test(lastSent) ? (lastSent.split(' ').length <= 6 ? lastSent : 'שלחו לנו הודעה 👇') : null;

  if (inspiration) {
    const took = [!want.vibe && fromInsp && `קצב ${inspiration.pace === 'fast' ? 'מהיר' : 'רגוע'}`, !want.color && inspiration.palette?.[0] && 'צבע ההדגשה'].filter(Boolean);
    if (took.length) notes.push(`מסרטון ההשראה: ${took.join(' ו')}`);
  }
  notes.push(`סגנון ${({ energetic: 'אנרגטי', pop: 'פופ', elegant: 'אלגנטי', calm: 'רגוע' })[vibeId]}`);
  notes.push(`${emphasis.length} מילים מודגשות`);
  const zooms = moments.filter((m) => m.kind === 'zoom').length;
  notes.push(zooms ? `${zooms} זומים ברגעי הדגשה` : 'בלי זום');
  const emojis = moments.filter((m) => m.kind === 'emoji').length;
  if (emojis) notes.push(`${emojis} אלמנטים קופצים`);
  if (hook) notes.push('כותרת פתיחה');
  if (ctaText) notes.push('קריאה לפעולה בסוף');

  return sanitizePlan(
    {
      summary: notes.join(' · '),
      style: { presetId: vibeId, font: want.font ?? vibe.font, primary: vibe.primary, secondary: vibe.secondary, accent },
      captions: {
        enabled: !want.noCaptions,
        mode: want.mode ?? vibe.mode,
        position: want.position ?? vibe.position,
        size: want.size ?? vibe.size,
        color: '#ffffff',
        highlightColor: accent,
        maxWordsPerLine: (want.mode ?? vibe.mode) === 'sentence' ? 6 : 3,
        emphasisStyle: want.box ? 'box' : vibe.emph,
      },
      hook,
      moments,
      emphasis,
      cuts: { removeSilences: want.silences ?? true, silenceThresholdMs: vibeId === 'energetic' ? 450 : 650 },
      music: { track: want.music ?? vibe.music, volume: 0.18 },
      transitions: { type: vibe.transition, intensity: 0.4 },
      cta: ctaText ? { text: ctaText } : null,
    },
    durationSec,
    words.length,
  );
}
