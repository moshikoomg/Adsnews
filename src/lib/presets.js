// ספריית סגנונות. כל preset הוא "פאץ'" שנפרס מעל ההגדרות הנוכחיות.
export const FONTS = [
  { id: 'heebo', label: 'Heebo נקי', css: 'Heebo, sans-serif' },
  { id: 'elegant', label: 'אלגנטי', css: '"Frank Ruhl Libre", serif' },
  { id: 'display', label: 'בולט', css: '"Rubik Mono One", sans-serif' },
  { id: 'bones', label: 'עצמות / קריאייטיב', css: '"Rubik Wet Paint", cursive' },
];

export const fontCss = (id) => FONTS.find((f) => f.id === id)?.css ?? FONTS[0].css;

// חבילות אייקונים לפי תחום – קופצים כ-B-Roll לפי מילות מפתח
export const NICHE_PACKS = {
  general: { label: 'כללי', keywords: { מבצע: '🔥', חדש: '✨', היום: '📅', חינם: '🎁' } },
  dental: { label: 'מרפאת שיניים', keywords: { שיניים: '🦷', חיוך: '😁', הלבנה: '✨', כאב: '⚡' } },
  ortho: { label: 'אורתופדיה / כירופרקטיקה', keywords: { עצם: '🦴', גב: '🦴', כאב: '⚡', תנועה: '🏃' } },
  food: { label: 'מסעדה / אוכל', keywords: { טעים: '😋', פיצה: '🍕', קפה: '☕', משלוח: '🛵' } },
  realestate: { label: 'נדל"ן', keywords: { דירה: '🏠', חדרים: '🛏️', מחיר: '💰', מיקום: '📍' } },
  beauty: { label: 'יופי / טיפוח', keywords: { עור: '💆', איפור: '💄', ציפורניים: '💅', שיער: '💇' } },
};

export const STYLE_PRESETS = [
  {
    id: 'elegant',
    name: 'אלגנטי / עסקי',
    emoji: '🖤',
    patch: {
      brand: { primary: '#111111', secondary: '#f5f1e8', accent: '#c9a45c', font: 'elegant' },
      captions: { mode: 'sentence', position: 'bottom', size: 'md', color: '#ffffff', highlightColor: '#c9a45c' },
      transitions: { type: 'fade', jumpCuts: false, intensity: 0.3 },
      audio: { music: 'corporate', musicVolume: 0.15 },
    },
  },
  {
    id: 'energetic',
    name: 'אנרגטי / טיקטוק קלאסי',
    emoji: '⚡',
    patch: {
      brand: { primary: '#000000', secondary: '#ffffff', accent: '#fe2c55', font: 'display' },
      captions: { mode: 'karaoke', position: 'center', size: 'lg', color: '#ffffff', highlightColor: '#fe2c55' },
      transitions: { type: 'zoom-in', jumpCuts: true, intensity: 0.8 },
      audio: { music: 'upbeat', musicVolume: 0.25, removeSilences: true },
    },
  },
  {
    id: 'pop',
    name: 'פופ / קריאייטיב',
    emoji: '🎨',
    patch: {
      brand: { primary: '#7c3aed', secondary: '#fde047', accent: '#22d3ee', font: 'bones' },
      captions: { mode: 'word', position: 'center', size: 'lg', color: '#fde047', highlightColor: '#22d3ee' },
      transitions: { type: 'zoom-out', jumpCuts: true, intensity: 0.6 },
      broll: { autoKeywords: true },
      audio: { music: 'upbeat', musicVolume: 0.2 },
    },
  },
  {
    id: 'clinic',
    name: 'קליניקה / רפואה',
    emoji: '🦴',
    patch: {
      brand: { primary: '#0f766e', secondary: '#ecfeff', accent: '#38bdf8', font: 'heebo', niche: 'ortho' },
      captions: { mode: 'karaoke', position: 'bottom', size: 'md', color: '#ffffff', highlightColor: '#38bdf8' },
      transitions: { type: 'cut', jumpCuts: true, intensity: 0.4 },
      broll: { autoKeywords: true },
      audio: { music: 'chill', musicVolume: 0.12 },
    },
  },
];

export const TRANSITIONS = [
  { id: 'cut', label: 'חיתוך חד' },
  { id: 'zoom-in', label: 'Zoom In' },
  { id: 'zoom-out', label: 'Zoom Out' },
  { id: 'fade', label: 'Fade' },
];

export const MUSIC = [
  { id: 'none', label: 'ללא' },
  { id: 'upbeat', label: 'קצבית' },
  { id: 'chill', label: 'רגועה' },
  { id: 'corporate', label: 'עסקית' },
];

export const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok', emoji: '🎵' },
  { id: 'instagram', label: 'Instagram Reels', emoji: '📸' },
  { id: 'youtube', label: 'YouTube Shorts', emoji: '▶️' },
  { id: 'facebook', label: 'Facebook', emoji: '👍' },
  { id: 'linkedin', label: 'LinkedIn', emoji: '💼' },
];
