import { useCallback, useState } from 'react';
import { useStudio } from '../store/useStudio';
import { useCamera } from '../hooks/useCamera';
import { useHoldToRecord } from '../hooks/useHoldToRecord';
import { readVideoMeta } from '../lib/media';
import EyesIndicator from '../components/record/EyesIndicator';
import Teleprompter from '../components/record/Teleprompter';
import RecordButton from '../components/record/RecordButton';
import { IconButton, Chips, Slider } from '../components/common/ui';

const MAX_SEC = 60;

export default function RecordScreen() {
  const { go, script, setScript, setSource } = useStudio();
  const { videoRef, stream, error } = useCamera();
  const [prompter, setPrompter] = useState({ show: true, mode: 'script', wpm: 140, fontSize: 22 });
  const [editing, setEditing] = useState(false);

  const onComplete = useCallback(
    async ({ blob, durationSec, mimeType }) => {
      const url = URL.createObjectURL(blob);
      const meta = await readVideoMeta(url);
      const track = stream?.getVideoTracks()[0]?.getSettings();
      setSource({ blob, url, origin: 'camera', mimeType, ...meta, durationSec: meta.durationSec || durationSec, width: track?.width, height: track?.height });
    },
    [setSource, stream],
  );

  const { start, stop, recording, elapsed } = useHoldToRecord(stream, { maxSec: MAX_SEC, onComplete });

  return (
    <div className="h-full relative">
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
      {error && (
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center p-8 text-center bg-black/90 z-40">
          <div className="text-4xl">📷</div>
          <p className="font-semibold">{error}</p>
          <p className="text-sm text-white/60">אם האתר פתוח בתוך תצוגה מקדימה, המצלמה חסומה בה. אפשר להעלות סרטון קיים, והצילום יעבוד כשהאתר רץ בכתובת משלו.</p>
          <button onClick={() => go('home')} className="btn-primary">חזרה להעלאת סרטון</button>
        </div>
      )}

      <EyesIndicator recording={recording} />

      {prompter.show && <Teleprompter script={script} recording={recording} {...prompter} />}

      {!recording && (
        <div className="absolute top-4 right-3 flex flex-col gap-3 z-20">
          <IconButton onClick={() => go('home')} aria-label="חזרה">✕</IconButton>
        </div>
      )}
      {!recording && (
        <div className="absolute top-4 left-3 flex flex-col gap-3 z-20">
          <IconButton onClick={() => setPrompter((p) => ({ ...p, show: !p.show }))} aria-label="טלפרומפטר">📜</IconButton>
          <IconButton onClick={() => setEditing(true)} aria-label="ערוך תסריט">✏️</IconButton>
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 pb-[max(env(safe-area-inset-bottom),24px)] pt-10 flex flex-col items-center gap-3 bg-gradient-to-t from-black/70 to-transparent z-20">
        <div className="text-sm font-mono">{recording ? `● ${elapsed.toFixed(1)}s` : 'החזק כדי להקליט'}</div>
        <RecordButton recording={recording} elapsed={elapsed} maxSec={MAX_SEC} onStart={start} onStop={stop} disabled={!stream} />
      </div>

      {editing && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">תסריט / נקודות דיבור</h2>
            <button onClick={() => setEditing(false)} className="chip chip-on">סיום</button>
          </div>
          <Chips
            options={[{ id: 'script', label: 'תסריט מלא' }, { id: 'bullets', label: 'נקודות (שורה לכל נקודה)' }]}
            value={prompter.mode}
            onChange={(mode) => setPrompter((p) => ({ ...p, mode }))}
          />
          <textarea value={script} onChange={(e) => setScript(e.target.value)} className="input flex-1 mt-4 text-lg leading-relaxed resize-none" placeholder="כתוב כאן מה תגיד..." />
          <Slider label="קצב גלילה (כשאין זיהוי דיבור)" value={prompter.wpm} min={80} max={220} step={5} onChange={(wpm) => setPrompter((p) => ({ ...p, wpm }))} format={(v) => `${v} מ׳/ד׳`} />
          <Slider label="גודל טקסט" value={prompter.fontSize} min={16} max={36} step={1} onChange={(fontSize) => setPrompter((p) => ({ ...p, fontSize }))} format={(v) => `${v}px`} />
        </div>
      )}
    </div>
  );
}
