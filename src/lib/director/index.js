import { supabase } from '../supabase';
import { sampleFrames, analyzeFrames } from '../frames';
import { localDirector } from './local';
import { sanitizePlan } from './plan';

/**
 * מנתח סרטון השראה: פריימים לדוגמה + ניתוח מקומי (פלטה, קצב).
 * הפריימים עצמם נשלחים ל-Claude כשיש Backend, כדי שיבין גם טיפוגרפיה ואלמנטים.
 */
export async function analyzeInspiration(url) {
  const { frames, durationSec } = await sampleFrames(url, { count: 8, width: 200 });
  const local = analyzeFrames(frames, durationSec);
  return { ...local, durationSec, frames: frames.map((f) => f.dataUrl) };
}

/**
 * "במאי ה-AI": מקבל תמלול, פריימים מהסרטון, בקשה חופשית והשראה – ומחזיר EditPlan מלא.
 * עם Supabase: Edge Function `ai-director` שקוראת ל-Claude (מבין תוכן, טון ותמונה).
 * בלי: במאי מקומי לפי כללים.
 */
export async function direct({ words, source, prompt, inspiration, niche, previousPlan, onStage }) {
  const durationSec = source.durationSec;
  if (supabase) {
    try {
      onStage?.('מנתח את הסרטון...');
      const { frames } = await sampleFrames(source.url, { count: 6, width: 256 });
      onStage?.('הבמאי עורך...');
      const { data, error } = await supabase.functions.invoke('ai-director', {
        body: {
          words: words.map((w, i) => ({ i, w: w.text, s: w.start, e: w.end })),
          durationSec,
          prompt,
          niche,
          frames: frames.map((f) => f.dataUrl),
          inspiration: inspiration ? { pace: inspiration.pace, palette: inspiration.palette, frames: inspiration.frames } : null,
          previousPlan: previousPlan ?? null,
        },
      });
      if (!error && data?.plan) return { plan: sanitizePlan(data.plan, durationSec, words.length), engine: 'claude' };
      console.warn('ai-director failed, using local', error);
    } catch (e) {
      console.warn('ai-director failed, using local', e);
    }
  }
  onStage?.('עורך...');
  await new Promise((r) => setTimeout(r, 500));
  return { plan: localDirector({ words, durationSec, prompt, inspiration, niche }), engine: 'local' };
}
