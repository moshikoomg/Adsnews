import { useEffect, useState } from 'react';
import { useStudio } from '../store/useStudio';
import { transcribe } from '../lib/captions';
import { useDirector } from '../hooks/useDirector';
import PreviewPlayer from '../components/editor/PreviewPlayer';
import BriefPanel from '../components/editor/BriefPanel';
import Sheet from '../components/common/Sheet';
import { ClipsPanel, StylePanel, CaptionsPanel, TransitionsPanel, AudioPanel } from '../components/editor/panels';

// הכלים בפס הימני – כמו במסך העריכה של טיקטוק. ✨ AI הוא הראשי
const RAIL = [
  { id: 'ai', icon: '✨', label: 'עריכת AI' },
  { id: 'captions', icon: 'Aa', label: 'טקסט' },
  { id: 'clips', icon: '🎞️', label: 'קטעים' },
  { id: 'style', icon: '🎨', label: 'סגנון' },
  { id: 'transitions', icon: '✂️', label: 'אפקטים' },
  { id: 'audio', icon: '🎵', label: 'צליל' },
];
const PANELS = { captions: CaptionsPanel, clips: ClipsPanel, style: StylePanel, transitions: TransitionsPanel, audio: AudioPanel };
const TITLES = { ai: 'מה לעשות עם הסרטון?', captions: 'טקסט וכתוביות', clips: 'קטעים', style: 'סגנון ומותג', transitions: 'מעברים ואפקטים', audio: 'צליל' };
const MUSIC = { none: 'בלי צליל', upbeat: 'קצבי', chill: 'רגוע', corporate: 'עסקי' };

export default function EditorScreen() {
  const { source, words, setWords, settings, script, go, ai, defaultBrief } = useStudio();
  const runDirector = useDirector();
  const [sheet, setSheet] = useState(null);
  const [chat, setChat] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!source) return go('record');
    if (!words.length) {
      transcribe({ blob: source.blob, durationSec: source.durationSec, fallbackText: source.origin === 'camera' ? script : null }).then((w) => {
        setWords(w);
        // יש בקשה שמורה כברירת מחדל? עורכים מיד. אחרת פותחים את הבריף
        if (useStudio.getState().defaultBrief) runDirector().then(flashSummary);
        else setSheet('ai');
      });
    }
  }, [source]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!source) return null;
  const busy = ai.status === 'working';

  function flashSummary(plan) {
    if (!plan) return;
    setToast(plan.summary);
    setTimeout(() => setToast(null), 4500);
  }

  const generate = async () => {
    setSheet(null);
    flashSummary(await runDirector());
  };
  const refine = async (e) => {
    e.preventDefault();
    const text = chat.trim();
    if (!text) return;
    setChat('');
    flashSummary(await runDirector(text));
  };

  const Panel = PANELS[sheet];

  return (
    <div className="h-full relative bg-black">
      <PreviewPlayer source={source} words={words} settings={settings} />

      {/* עליון: חזרה + צליל */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
        <button onClick={() => go('record')} className="w-9 h-9 rounded-full bg-black/40 backdrop-blur text-lg" aria-label="חזרה למצלמה">‹</button>
        <button onClick={() => setSheet('audio')} className="flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur px-4 py-1.5 text-sm font-semibold">
          🎵 {MUSIC[settings.audio.music] ?? 'הוסף צליל'}
        </button>
        <span className="w-9" />
      </div>

      {/* פס כלים ימני */}
      <div className="absolute right-2 top-20 z-20 flex flex-col gap-3">
        {RAIL.map((r) => (
          <button key={r.id} onClick={() => setSheet(r.id)} className="flex flex-col items-center gap-0.5 w-14">
            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold drop-shadow ${r.id === 'ai' ? 'bg-gradient-to-br from-pink-500 to-violet-500' : 'bg-black/35 backdrop-blur'}`}>{r.icon}</span>
            <span className="text-[10px] font-semibold drop-shadow">{r.label}</span>
          </button>
        ))}
      </div>

      {(busy || !words.length) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/55 backdrop-blur-sm pointer-events-none">
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-pink-500 animate-spin" />
          <div className="text-sm font-semibold">{!words.length ? 'מתמלל את הסרטון...' : ai.stage || 'הבמאי עורך...'}</div>
        </div>
      )}

      {toast && (
        <div className="absolute top-16 inset-x-6 z-30 rounded-2xl bg-white text-black px-4 py-3 text-sm font-semibold shadow-xl animate-pop">
          ✨ {toast}
        </div>
      )}

      {/* תחתון: צ'אט תיקונים + הבא */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-3 pb-[max(env(safe-area-inset-bottom),14px)] pt-8 bg-gradient-to-t from-black/80 to-transparent">
        {settings.plan ? (
          <form onSubmit={refine} className="flex gap-2 mb-3">
            <input
              id="refine"
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder='בקש שינוי: "תגדיל את הטקסט", "בלי זום"...'
              className="flex-1 rounded-full bg-white/15 backdrop-blur px-4 py-2.5 text-sm outline-none placeholder:text-white/50"
            />
            <button disabled={busy || !chat.trim()} className="w-11 h-11 rounded-full bg-white text-black font-bold disabled:opacity-40" aria-label="שלח">↑</button>
          </form>
        ) : (
          <button onClick={() => setSheet('ai')} className="w-full mb-3 rounded-full bg-white/15 backdrop-blur py-2.5 text-sm">
            ✨ ספר לבמאי מה לעשות עם הסרטון
          </button>
        )}
        <div className="flex gap-2">
          <button onClick={() => setSheet('ai')} className="flex-1 rounded-lg bg-white/15 py-3 text-sm font-semibold">
            {defaultBrief ? '✨ הבריף שלך' : '✨ בריף'}
          </button>
          <button onClick={() => go('publish')} disabled={!words.length || !source.clips?.length || busy} className="flex-[2] rounded-lg bg-[#fe2c55] py-3 font-bold disabled:opacity-40">
            הבא
          </button>
        </div>
      </div>

      <Sheet open={sheet === 'ai'} onClose={() => setSheet(null)} title={TITLES.ai} tall>
        <BriefPanel onGenerate={generate} busy={busy} />
      </Sheet>
      <Sheet open={!!Panel} onClose={() => setSheet(null)} title={TITLES[sheet]}>
        {Panel && <Panel />}
      </Sheet>
    </div>
  );
}
