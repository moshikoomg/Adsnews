import { useEffect, useState } from 'react';
import { useStudio, SECTIONS } from '../store/useStudio';
import { transcribe } from '../lib/captions';
import PreviewPlayer from '../components/editor/PreviewPlayer';
import BottomSheet from '../components/common/BottomSheet';
import { StylePanel, CaptionsPanel, TransitionsPanel, AudioPanel, PromptPanel } from '../components/editor/panels';
import { IconButton } from '../components/common/ui';

const TABS = [
  { id: 'style', label: 'סגנון', icon: '🎨', Panel: StylePanel },
  { id: 'captions', label: 'כתוביות', icon: '💬', Panel: CaptionsPanel },
  { id: 'transitions', label: 'מעברים', icon: '✂️', Panel: TransitionsPanel },
  { id: 'audio', label: 'אודיו', icon: '🎵', Panel: AudioPanel },
  { id: 'prompt', label: 'AI', icon: '✨', Panel: PromptPanel },
];

export default function EditorScreen() {
  const { source, words, setWords, settings, script, go, pinned, togglePin, saveDefaults } = useStudio();
  const [tab, setTab] = useState('style');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!source) return go('home');
    if (!words.length) transcribe({ blob: source.blob, durationSec: source.durationSec, fallbackText: source.origin === 'camera' ? script : null }).then(setWords);
  }, [source]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!source) return null;
  const { Panel } = TABS.find((t) => t.id === tab);
  const isPinned = pinned.includes(tab);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  };
  const onSaveDefaults = async () => {
    const n = await saveDefaults(pinned.length === 0);
    flash(pinned.length === 0 ? 'כל ההגדרות נשמרו כברירת מחדל ✓' : `${n} מקטעים נשמרו כברירת מחדל ✓`);
  };

  return (
    <div className="h-full relative bg-black">
      <div className="absolute inset-x-0 top-0 h-[56%] pt-3 px-3">
        <PreviewPlayer source={source} words={words} settings={settings} />
      </div>
      <div className="absolute top-4 right-4 z-20">
        <IconButton onClick={() => go('home')}>✕</IconButton>
      </div>
      {!words.length && <div className="absolute top-[25%] inset-x-0 text-center text-sm text-white/70 z-20">מתמלל...</div>}

      <BottomSheet
        header={
          <div className="px-4">
            <div className="flex gap-1 overflow-x-auto no-scrollbar">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 min-w-[64px] py-2 rounded-xl text-xs flex flex-col items-center gap-0.5 ${tab === t.id ? 'bg-white/10' : 'text-white/60'}`}>
                  <span className="text-lg">{t.icon}</span>
                  {t.label}
                  {pinned.includes(t.id) && <span className="text-[9px]">📌</span>}
                </button>
              ))}
            </div>
            <button onClick={() => togglePin(tab)} className={`w-full my-3 py-2 rounded-xl text-sm border transition ${isPinned ? 'border-amber-300 bg-amber-300/15 text-amber-200' : 'border-dashed border-white/20 text-white/60'}`}>
              {isPinned ? `📌 "${SECTIONS[tab].label}" מסומן כברירת מחדל` : `📍 סמן את "${SECTIONS[tab].label}" כברירת מחדל`}
            </button>
          </div>
        }
      >
        <Panel />
      </BottomSheet>

      <div className="absolute bottom-0 inset-x-0 z-40 p-4 pb-[max(env(safe-area-inset-bottom),16px)] bg-gradient-to-t from-black via-black/95 to-transparent flex gap-2">
        <button onClick={onSaveDefaults} className="px-4 rounded-2xl bg-white/10 border border-white/15 text-sm font-semibold whitespace-nowrap">
          💾 {pinned.length ? 'שמור נעוצים' : 'שמור הכל כדיפולט'}
        </button>
        <button onClick={() => go('publish')} disabled={!words.length} className="btn-primary">
          צור סרטון ←
        </button>
      </div>

      {toast && <div className="absolute top-20 inset-x-8 z-50 rounded-xl bg-white text-black text-center py-2 text-sm font-semibold animate-pop">{toast}</div>}
    </div>
  );
}
