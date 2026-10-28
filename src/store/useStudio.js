import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FACTORY_SETTINGS, deepMerge } from '../lib/defaults';
import { STYLE_PRESETS } from '../lib/presets';
import { supabase } from '../lib/supabase';

// מקטעי הגדרות שאפשר "לנעוץ" כברירת מחדל
export const SECTIONS = {
  style: { label: 'סגנון ומותג', keys: ['presetId', 'brand'] },
  captions: { label: 'כתוביות', keys: ['captions'] },
  transitions: { label: 'מעברים ו-B-Roll', keys: ['transitions', 'broll'] },
  audio: { label: 'אודיו ושתיקות', keys: ['audio'] },
  prompt: { label: 'בקשה אישית', keys: ['customPrompt'] },
};

const newId = () => crypto.randomUUID();
const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

export const useStudio = create(
  persist(
    (set, get) => ({
      screen: 'record', // record | editor | publish (כמו טיקטוק: נפתח ישר למצלמה)
      script: 'היי! אני משה מהעסק שלנו. היום אני רוצה לספר לכם על מבצע חדש ומיוחד.\nבואו לבקר אותנו כבר היום!',
      source: null, // { blob, url, origin, mimeType, durationSec, width, height }
      words: [],
      settings: FACTORY_SETTINGS,
      defaults: {}, // רק המקטעים שננעצו
      pinned: [], // מפתחות מ-SECTIONS
      job: null,
      render: { stage: null, progress: 0, result: null, error: null },

      // במאי ה-AI
      brief: { prompts: [], inspiration: null }, // הבקשות של הסרטון הנוכחי (ראשונה + תיקונים)
      defaultBrief: null, // בקשה + השראה שנשמרו כברירת מחדל לכל סרטון חדש
      ai: { status: 'idle', stage: '', engine: null }, // idle | working | done
      setBrief: (patch) => set((s) => ({ brief: { ...s.brief, ...patch } })),
      setAi: (patch) => set((s) => ({ ai: { ...s.ai, ...patch } })),
      setSettings: (settings) => set({ settings }),
      saveDefaultBrief: () => {
        const { brief } = get();
        set({ defaultBrief: { prompts: brief.prompts, inspiration: brief.inspiration } });
      },
      clearDefaultBrief: () => set({ defaultBrief: null }),

      go: (screen) => set({ screen }),
      setScript: (script) => set({ script }),

      // סרטון חדש (מצלמה או העלאה) – מתחיל תמיד מברירות המחדל השמורות
      setSource: (source) => {
        const old = get().source;
        if (old?.url) URL.revokeObjectURL(old.url);
        const clips = (source.clips?.length ? source.clips : [{ id: newId(), start: 0, end: source.durationSec || 0 }]).map((c) => ({ trimStart: 0, trimEnd: 0, ...c }));
        set({
          source: { ...source, clips },
          words: [],
          settings: deepMerge(FACTORY_SETTINGS, get().defaults),
          job: null,
          render: { stage: null, progress: 0, result: null, error: null },
          brief: get().defaultBrief ? { ...get().defaultBrief } : { prompts: [], inspiration: null },
          ai: { status: 'idle', stage: '', engine: null },
          screen: 'editor',
        });
      },
      setWords: (words) => set({ words }),

      // עריכת קטעים (כמו בטיקטוק): קיצוץ, מחיקה, סידור מחדש ופיצול
      updateClip: (id, patch) => set((s) => ({ source: { ...s.source, clips: s.source.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)) } })),
      removeClip: (id) => set((s) => ({ source: { ...s.source, clips: s.source.clips.filter((c) => c.id !== id) } })),
      moveClip: (id, dir) =>
        set((s) => {
          const clips = [...s.source.clips];
          const i = clips.findIndex((c) => c.id === id);
          const j = i + dir;
          if (i < 0 || j < 0 || j >= clips.length) return {};
          [clips[i], clips[j]] = [clips[j], clips[i]];
          return { source: { ...s.source, clips } };
        }),
      splitClipAt: (t) =>
        set((s) => {
          const clips = s.source.clips.flatMap((c) => {
            const a = c.start + c.trimStart;
            const b = c.end - c.trimEnd;
            if (t <= a + 0.3 || t >= b - 0.3) return [c];
            return [{ ...c, end: t, trimEnd: 0 }, { ...c, id: newId(), start: t, trimStart: 0 }];
          });
          return { source: { ...s.source, clips } };
        }),
      seek: null, // { t, n } – בקשה לתצוגה המקדימה לקפוץ לזמן
      seekTo: (t) => set({ seek: { t, n: Math.random() } }),

      update: (path, value) =>
        set((s) => {
          const [root, key] = path.split('.');
          const settings = key
            ? { ...s.settings, [root]: { ...s.settings[root], [key]: value } }
            : { ...s.settings, [root]: value };
          return { settings };
        }),

      applyPreset: (id) => {
        const p = STYLE_PRESETS.find((x) => x.id === id);
        if (p) set((s) => ({ settings: { ...deepMerge(s.settings, p.patch), presetId: id } }));
      },

      togglePin: (section) =>
        set((s) => ({ pinned: s.pinned.includes(section) ? s.pinned.filter((x) => x !== section) : [...s.pinned, section] })),

      // שומר את המקטעים הנעוצים כברירת מחדל לסרטונים הבאים
      saveDefaults: async (all = false) => {
        const { settings, pinned } = get();
        const sections = all ? Object.keys(SECTIONS) : pinned;
        const keys = sections.flatMap((s) => SECTIONS[s].keys);
        const defaults = pick(settings, keys);
        set({ defaults, pinned: sections });
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) await supabase.from('user_defaults').upsert({ user_id: data.user.id, settings: defaults });
        }
        return sections.length;
      },
      resetDefaults: () => set({ defaults: {}, pinned: [] }),

      setJob: (job) => set({ job }),
      setRender: (patch) => set((s) => ({ render: { ...s.render, ...patch } })),
    }),
    {
      name: 'video-studio',
      // נשמר מקומית: ברירות מחדל, נעיצות ותסריט. לא נשמר: הקובץ עצמו.
      partialize: (s) => ({ defaults: s.defaults, pinned: s.pinned, script: s.script, defaultBrief: s.defaultBrief }),
    },
  ),
);
