import { useCallback } from 'react';
import { useStudio } from '../store/useStudio';
import { direct } from '../lib/director';
import { planToSettings } from '../lib/director/plan';

// מפעיל את במאי ה-AI על הסרטון הנוכחי. extraPrompt = תיקון מהצ'אט ("תגדיל את הטקסט")
export function useDirector() {
  return useCallback(async (extraPrompt) => {
    const st = useStudio.getState();
    const { source, words, brief, settings } = st;
    if (!source || !words.length) return;
    const prompts = extraPrompt ? [...brief.prompts, extraPrompt] : brief.prompts;
    st.setBrief({ prompts });
    st.setAi({ status: 'working', stage: 'מתחיל...' });
    try {
      const { plan, engine } = await direct({
        words,
        source,
        prompt: prompts,
        inspiration: brief.inspiration,
        niche: settings.brand.niche,
        previousPlan: settings.plan,
        onStage: (stage) => st.setAi({ stage }),
      });
      useStudio.getState().setSettings(planToSettings(plan, useStudio.getState().settings));
      st.setAi({ status: 'done', stage: '', engine });
      return plan;
    } catch (e) {
      st.setAi({ status: 'idle', stage: 'שגיאה: ' + e.message });
    }
  }, []);
}
