// מייצר sample-job.json בעזרת אותו buildRenderJob שה-Frontend משתמש בו
import { writeFileSync } from 'node:fs';
import { buildRenderJob } from '../src/lib/renderJob.js';
import { FACTORY_SETTINGS, deepMerge } from '../src/lib/defaults.js';
import { STYLE_PRESETS } from '../src/lib/presets.js';
import { localDirector } from '../src/lib/director/local.js';
import { planToSettings } from '../src/lib/director/plan.js';

const presetId = process.argv[2] ?? 'energetic';
const preset = STYLE_PRESETS.find((p) => p.id === presetId);
let settings = { ...deepMerge(FACTORY_SETTINGS, preset.patch), presetId };
settings.brand.businessName = 'העסק של משה';
settings.brand.niche = 'dental';

// תמלול לדוגמה, עם שתיקה ארוכה באמצע (תיחתך)
const text = 'היי אני משה מהמרפאה. היום יש מבצע הלבנה של 50 אחוז הנחה | בואו לקבל חיוך חדש כבר היום';
let t = 0.3;
const words = [];
for (const w of text.split(' ')) {
  if (w === '|') { t += 1.5; continue; }
  words.push({ text: w, start: +t.toFixed(2), end: +(t + 0.38).toFixed(2) });
  t += 0.42;
}

// במאי ה-AI (מקומי) מחליט על העריכה לפי הבקשה
const plan = localDirector({ words, durationSec: 8, prompt: process.argv[3] ?? 'סגנון טיקטוק אנרגטי, תדגיש מחירים, קריאה לפעולה בסוף', niche: 'dental' });
settings = planToSettings(plan, settings);
console.log('plan:', plan.summary);

const job = buildRenderJob({
  source: { origin: 'upload', remoteUrl: 'sample.mp4', mimeType: 'video/mp4', durationSec: 8, width: 720, height: 1280 },
  words,
  settings,
  publishTargets: ['tiktok', 'instagram'],
});
writeFileSync(new URL('./sample-job.json', import.meta.url), JSON.stringify(job, null, 2));
console.log(`sample-job.json: preset=${presetId}, ${job.timeline.segments.length} segments, ${job.overlays.length} overlays`);
