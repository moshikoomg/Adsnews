// מבנה הגדרות העריכה. זה ה"חוזה" בין ה-UI לבין מנוע הרינדור.
export const FACTORY_SETTINGS = {
  presetId: 'energetic',
  brand: {
    businessName: '',
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#fe2c55',
    font: 'display',
    logoUrl: '',
    niche: 'general',
  },
  captions: {
    enabled: true,
    mode: 'karaoke', // karaoke | word | sentence
    position: 'center', // top | center | bottom
    size: 'lg', // sm | md | lg
    color: '#ffffff',
    highlightColor: '#fe2c55',
    maxWordsPerLine: 4,
  },
  // jumpCuts = זום קופץ בין משפטים. zoomLevel = כמה להגדיל (0.06 = 6%), zoomEvery = כל כמה משפטים
  transitions: { type: 'zoom-in', jumpCuts: true, intensity: 0.5, zoomLevel: 0.06, zoomEvery: 3 },
  broll: { autoKeywords: true, items: [] }, // items: [{ keyword, kind: 'emoji'|'image'|'video', src }]
  audio: { removeSilences: true, silenceThresholdMs: 600, music: 'upbeat', musicVolume: 0.25 },
  customPrompt: '',
  output: { aspect: '9:16', width: 1080, height: 1920, fps: 30 },
};

// מיזוג עמוק פשוט (לאובייקטים בלבד, מערכים מוחלפים)
export function deepMerge(base, patch) {
  if (!patch) return base;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? deepMerge(base?.[k] ?? {}, v) : v;
  }
  return out;
}
