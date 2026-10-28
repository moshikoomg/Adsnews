import { useRef } from 'react';
import { useStudio, SECTIONS } from '../store/useStudio';
import { readVideoMeta } from '../lib/media';
import { isMock } from '../lib/supabase';

export default function HomeScreen() {
  const { go, setSource, pinned, resetDefaults } = useStudio();
  const fileRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const meta = await readVideoMeta(url);
    setSource({ blob: file, url, origin: 'upload', mimeType: file.type, name: file.name, ...meta });
    e.target.value = '';
  };

  return (
    <div className="h-full flex flex-col px-5 pt-14 pb-8 bg-gradient-to-b from-violet-950 via-black to-black">
      <h1 className="text-3xl font-extrabold leading-tight">
        סטודיו וידאו
        <br />
        <span className="bg-gradient-to-l from-pink-400 to-violet-400 bg-clip-text text-transparent">לעסק שלך</span>
      </h1>
      <p className="text-white/60 mt-2">מצלמים או מעלים, בוחרים סגנון פעם אחת, וכל סרטון הבא כבר יוצא ערוך.</p>

      <div className="mt-10 space-y-4">
        <button onClick={() => go('record')} className="w-full rounded-3xl p-5 text-right bg-gradient-to-l from-pink-500 to-rose-500 active:scale-[.98] transition">
          <div className="text-3xl">🎥</div>
          <div className="text-xl font-bold mt-2">צלם סרטון</div>
          <div className="text-sm text-white/80">מצלמה קדמית, טלפרומפטר, החזק כדי להקליט</div>
        </button>
        <button onClick={() => fileRef.current?.click()} className="w-full rounded-3xl p-5 text-right bg-white/10 border border-white/10 active:scale-[.98] transition">
          <div className="text-3xl">📤</div>
          <div className="text-xl font-bold mt-2">העלה סרטון קיים</div>
          <div className="text-sm text-white/70">שלח סרטון מהגלריה וסמן מה תרצה כברירת מחדל</div>
        </button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onFile} />
      </div>

      <div className="mt-auto rounded-2xl bg-white/5 border border-white/10 p-4 text-sm">
        <div className="font-semibold mb-1">📌 ברירות המחדל שלך</div>
        {pinned.length ? (
          <>
            <div className="flex flex-wrap gap-1.5 my-2">
              {pinned.map((p) => <span key={p} className="chip chip-on text-xs">{SECTIONS[p].label}</span>)}
            </div>
            <button onClick={resetDefaults} className="text-white/50 underline text-xs">איפוס ברירות מחדל</button>
          </>
        ) : (
          <div className="text-white/60">עוד לא נשמרו. בסטודיו העריכה לחץ 📌 על כל מקטע שתרצה לקבע.</div>
        )}
        {isMock && <div className="text-[11px] text-amber-300/80 mt-2">מצב הדגמה: Supabase לא מחובר, רינדור מדומה.</div>}
      </div>
    </div>
  );
}
