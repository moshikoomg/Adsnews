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

const pick = (obj, keys) => Object.fromEntries(keys.map((k) => [k, obj[k]]));

export const useStudio = create(
  persist(
    (set, get) => ({
      screen: 'home', // home | record | editor | publish
      script: 'היי! אני משה מהעסק שלנו. היום אני רוצה לספר לכם על מבצע חדש ומיוחד.\nבואו לבקר אותנו כבר היום!',
      source: null, // { blob, url, origin, mimeType, durationSec, width, height }
      words: [],
      settings: FACTORY_SETTINGS,
      defaults: {}, // רק המקטעים שננעצו
      pinned: [], // מפתחות מ-SECTIONS
      job: null,
      render: { stage: null, progress: 0, result: null, error: null },

      go: (screen) => set({ screen }),
      setScript: (script) => set({ script }),

      // סרטון חדש (מצלמה או העלאה) – מתחיל תמיד מברירות המחדל השמורות
      setSource: (source) => {
        const old = get().source;
        if (old?.url) URL.revokeObjectURL(old.url);
        set({
          source,
          words: [],
          settings: deepMerge(FACTORY_SETTINGS, get().defaults),
          job: null,
          render: { stage: null, progress: 0, result: null, error: null },
          screen: 'editor',
        });
      },
      setWords: (words) => set({ words }),

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
      partialize: (s) => ({ defaults: s.defaults, pinned: s.pinned, script: s.script }),
    },
  ),
);
