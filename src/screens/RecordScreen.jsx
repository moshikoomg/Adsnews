import { useCallback, useState } from 'react';
import { useStudio } from '../store/useStudio';
import { useCamera, useCameraZoom } from '../hooks/useCamera';
import { useClipRecorder } from '../hooks/useClipRecorder';
import { readVideoMeta } from '../lib/media';
import EyesIndicator from '../components/record/EyesIndicator';
import Teleprompter from '../components/record/Teleprompter';
import RecordButton from '../components/record/RecordButton';
import ClipProgress from '../components/record/ClipProgress';
import { IconButton, Chips, Slider } from '../components/common/ui';

const MAX_SEC = 60;

export default function RecordScreen() {
  const { go, script, setScript, setSource } = useStudio();
  const { videoRef, stream, error } = useCamera();
  const cam = useCameraZoom(stream);
  const [prompter, setPrompter] = useState({ show: true, mode: 'script', wpm: 140, fontSize: 22 });
  const [editing, setEditing] = useState(false);
  const [fit, setFit] = useState('cover'); // cover = מסך מלא, contain = כל הפריים בלי חיתוך
  const [confirmDelete, setConfirmDelete] = useState(false);

  const onComplete = useCallback(
    async ({ blob, clips, mimeType, durationSec }) => {
      const url = URL.createObjectURL(blob);
      const meta = await readVideoMeta(url);
      const track = stream?.getVideoTracks()[0]?.getSettings();
      setSource({ blob, url, origin: 'camera', mimeType, ...meta, durationSec: meta.durationSec || durationSec, width: track?.width, height: track?.height, clips });
    },
    [setSource, stream],
  );

  const r = useClipRecorder(stream, { maxSec: MAX_SEC, onComplete });
  const hasClips = r.clips.length > 0;

  const onDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2500);
      return;
    }
    r.deleteLast();
    setConfirmDelete(false);
  };

  return (
    <div className="h-full relative bg-black">
      <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full -scale-x-100 ${fit === 'cover' ? 'object-cover' : 'object-contain'}`} />
      {error && (
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center p-8 text-center bg-black/90 z-40">
          <div className="text-4xl">📷</div>
          <p className="font-semibold">{error}</p>
          <p className="text-sm text-white/60">אם האתר פתוח בתוך תצוגה מקדימה, המצלמה חסומה בה. אפשר להעלות סרטון קיים, והצילום יעבוד כשהאתר רץ בכתובת משלו.</p>
          <button onClick={() => go('home')} className="btn-primary">חזרה להעלאת סרטון</button>
        </div>
      )}

      <div className="absolute top-0 inset-x-0 px-3 pt-[max(env(safe-area-inset-top),6px)] z-30">
        <ClipProgress clips={r.clips} current={r.current} recording={r.recording} maxSec={MAX_SEC} />
      </div>

      <EyesIndicator recording={r.recording} />

      {prompter.show && <Teleprompter script={script} recording={r.recording} {...prompter} />}

      {!r.recording && (
        <>
          <div className="absolute top-5 right-3 z-20">
            <IconButton onClick={() => go('home')} aria-label="חזרה">✕</IconButton>
          </div>
          <div className="absolute top-5 left-3 flex flex-col gap-3 z-20">
            <IconButton onClick={() => setPrompter((p) => ({ ...p, show: !p.show }))} aria-label="טלפרומפטר">📜</IconButton>
            <IconButton onClick={() => setEditing(true)} aria-label="ערוך תסריט">✏️</IconButton>
            <IconButton onClick={() => setFit((f) => (f === 'cover' ? 'contain' : 'cover'))} aria-label="התאמת תצוגה" className="text-sm font-bold">
              {fit === 'cover' ? '⤡' : '⤢'}
            </IconButton>
          </div>
        </>
      )}

      {cam.range && (
        <div className="absolute left-3 bottom-48 z-20 flex flex-col items-center gap-1">
          <span className="text-[11px] bg-black/50 rounded-full px-2 py-0.5">{cam.zoom.toFixed(1)}x</span>
          <input
            type="range"
            min={cam.range.min}
            max={cam.range.max}
            step={cam.range.step}
            value={cam.zoom}
            onChange={(e) => cam.setZoom(+e.target.value)}
            className="accent-pink-500 w-28 -rotate-90 origin-center my-12"
            aria-label="זום מצלמה"
          />
        </div>
      )}

      <div className="absolute bottom-0 inset-x-0 pb-[max(env(safe-area-inset-bottom),24px)] pt-10 bg-gradient-to-t from-black/70 to-transparent z-20">
        <div className="text-center text-sm font-mono mb-3">
          {r.recording ? `● ${r.totalSec.toFixed(1)}s` : hasClips ? `${r.clips.length} קטעים · ${r.totalSec.toFixed(1)}s` : 'לחץ או החזק כדי להקליט'}
        </div>
        <div className="flex items-center justify-around px-6">
          <div className="w-16 flex justify-center">
            {hasClips && !r.recording && (
              <button onClick={onDelete} className={`h-12 rounded-full px-3 text-sm font-semibold transition ${confirmDelete ? 'bg-red-500' : 'bg-black/50 backdrop-blur'}`}>
                {confirmDelete ? 'למחוק?' : '⌫ קטע'}
              </button>
            )}
          </div>
          <RecordButton recording={r.recording} onStart={r.start} onStop={r.pause} disabled={!stream || r.totalSec >= MAX_SEC} />
          <div className="w-16 flex justify-center">
            {hasClips && !r.recording && (
              <button onClick={r.finish} className="w-12 h-12 rounded-full bg-[#fe2c55] text-xl font-bold" aria-label="סיום ומעבר לעריכה">
                ✓
              </button>
            )}
          </div>
        </div>
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
