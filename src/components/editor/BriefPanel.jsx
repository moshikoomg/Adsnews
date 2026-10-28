import { useRef, useState } from 'react';
import { useStudio } from '../../store/useStudio';
import { analyzeInspiration } from '../../lib/director';

const IDEAS = [
  'סגנון טיקטוק אנרגטי, טקסט בולט מילה אחרי מילה',
  'אלגנטי ויוקרתי, כתוביות למטה',
  'פונט בסגנון עצמות, צבעוני וכיפי',
  'תחתוך שתיקות ותוסיף מוזיקה קצבית',
  'תדגיש מחירים ומבצעים בגדול',
  'בלי זום, הכל רגוע ונקי',
  'קריאה לפעולה בסוף',
];

const PACE = { fast: 'קצב מהיר', medium: 'קצב בינוני', slow: 'קצב רגוע' };

// ה"בריף" לבמאי: מה אתה רוצה + סרטון השראה. כאן מתחילה העריכה
export default function BriefPanel({ onGenerate, busy }) {
  const brief = useStudio((s) => s.brief);
  const defaultBrief = useStudio((s) => s.defaultBrief);
  const { setBrief, saveDefaultBrief, clearDefaultBrief } = useStudio.getState();
  const [text, setText] = useState(brief.prompts[0] ?? '');
  const [analyzing, setAnalyzing] = useState(false);
  const [asDefault, setAsDefault] = useState(!!defaultBrief);
  const fileRef = useRef(null);

  const onInspiration = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    try {
      const url = URL.createObjectURL(file);
      const insp = await analyzeInspiration(url);
      URL.revokeObjectURL(url);
      setBrief({ inspiration: { ...insp, name: file.name } });
    } finally {
      setAnalyzing(false);
      e.target.value = '';
    }
  };

  const go = () => {
    setBrief({ prompts: text.trim() ? [text.trim()] : [] });
    if (asDefault) saveDefaultBrief();
    else if (defaultBrief) clearDefaultBrief();
    onGenerate();
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="label" htmlFor="brief-text">מה לעשות עם הסרטון?</label>
        <textarea
          id="brief-text"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input resize-none text-base"
          placeholder="כתוב כמו לעורך: איך הטקסט ייראה, מה להדגיש, איזה אווירה..."
        />
        <div className="flex gap-2 overflow-x-auto no-scrollbar mt-2">
          {IDEAS.map((t) => (
            <button key={t} onClick={() => setText((x) => (x ? `${x}, ${t}` : t))} className="chip text-xs">+ {t}</button>
          ))}
        </div>
      </div>

      <div>
        <span className="label">סרטון השראה (לא חובה)</span>
        {brief.inspiration ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-3">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {brief.inspiration.frames.slice(0, 6).map((f, i) => <img key={i} src={f} alt="" className="h-20 rounded-lg" />)}
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/70">
              {brief.inspiration.palette.map((c) => <span key={c} className="w-4 h-4 rounded-full border border-white/30" style={{ background: c }} />)}
              <span>{PACE[brief.inspiration.pace]}</span>
              <button onClick={() => setBrief({ inspiration: null })} className="mr-auto text-white/50 underline">הסר</button>
            </div>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()} disabled={analyzing} className="w-full rounded-2xl border border-dashed border-white/25 py-4 text-sm text-white/70">
            {analyzing ? 'מנתח את הסגנון...' : '🎬 העלה סרטון שאהבת, ונעתיק את הסגנון שלו'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onInspiration} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={asDefault} onChange={(e) => setAsDefault(e.target.checked)} className="accent-pink-500 w-4 h-4" />
        שמור את הבקשה וההשראה כברירת מחדל לכל סרטון חדש
      </label>

      <button onClick={go} disabled={busy} className="btn-primary text-lg">
        {busy ? 'עורך...' : '✨ ערוך לי את הסרטון'}
      </button>
    </div>
  );
}
