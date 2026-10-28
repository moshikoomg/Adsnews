import { useCallback, useRef, useState } from 'react';
import { useStudio } from '../store/useStudio';
import { useCamera, useCameraZoom } from '../hooks/useCamera';
import { useClipRecorder } from '../hooks/useClipRecorder';
import { readVideoMeta } from '../lib/media';
import EyesIndicator from '../components/record/EyesIndicator';
import Teleprompter from '../components/record/Teleprompter';
import RecordButton from '../components/record/RecordButton';
import ClipProgress from '../components/record/ClipProgress';
import { Chips, Slider } from '../components/common/ui';

const DURATIONS = [
  { id: 15, label: '15 ש׳' },
  { id: 60, label: '60 ש׳' },
  { id: 180, label: '3 ד׳' },
];

function RailButton({ icon, label, onClick, on }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5 w-14">
      <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg drop-shadow ${on ? 'bg-white text-black' : 'bg-black/30 backdrop-blur'}`}>{icon}</span>
      <span className="text-[10px] font-semibold drop-shadow">{label}</span>
    </button>
  );
}

// מסך הצילום – בנוי כמו המצלמה של טיקטוק
export default function RecordScreen() {
  const { script, setScript, setSource } = useStudio();
  const cam = useCamera();
  const zoom = useCameraZoom(cam.stream);
  const [maxSec, setMaxSec] = useState(60);
  const [prompter, setPrompter] = useState({ show: false, mode: 'script', wpm: 140, fontSize: 22 });
  const [editing, setEditing] = useState(false);
  const [fit, setFit] = useState('cover');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const fileRef = useRef(null);

  const onComplete = useCallback(
    async ({ blob, clips, mimeType, durationSec }) => {
      const url = URL.createObjectURL(blob);
      const meta = await readVideoMeta(url);
      const s = cam.settings;
      setSource({ blob, url, origin: 'camera', mirrored: cam.mirrored, mimeType, ...meta, durationSec: meta.durationSec || durationSec, width: s?.width, height: s?.height, clips });
    },
    [setSource, cam.settings, cam.mirrored],
  );

  const r = useClipRecorder(cam.stream, { maxSec, onComplete });
  const hasClips = r.clips.length > 0;
  const idle = !r.recording && !countdown;

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const meta = await readVideoMeta(url);
    setSource({ blob: file, url, origin: 'upload', mimeType: file.type, name: file.name, ...meta });
    e.target.value = '';
  };

  const start = () => {
    if (!timerOn || r.recording) return r.start();
    let n = 3;
    setCountdown(n);
    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        setCountdown(0);
        r.start();
      } else setCountdown(n);
    }, 1000);
  };

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
      <video ref={cam.videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full ${cam.mirrored ? '-scale-x-100' : ''} ${fit === 'cover' ? 'object-cover' : 'object-contain'}`} />

      {cam.error && (
        <div className="absolute inset-0 flex flex-col gap-4 items-center justify-center p-8 text-center bg-black z-40">
          <div className="text-4xl">📷</div>
          <p className="font-semibold">{cam.error}</p>
          <p className="text-sm text-white/60">אפשר להעלות סרטון קיים במקום.</p>
          <button onClick={() => fileRef.current?.click()} className="btn-primary">העלה סרטון</button>
        </div>
      )}

      <div className="absolute top-0 inset-x-0 px-3 pt-[max(env(safe-area-inset-top),6px)] z-30">
        <ClipProgress clips={r.clips} current={r.current} recording={r.recording} maxSec={maxSec} />
      </div>

      {r.recording && <EyesIndicator recording />}
      {prompter.show && <Teleprompter script={script} recording={r.recording} {...prompter} />}

      {idle && (
        <>
          <div className="absolute top-6 inset-x-0 flex justify-center z-20">
            <button onClick={() => setEditing(true)} className="rounded-full bg-black/45 backdrop-blur px-4 py-1.5 text-sm font-semibold">📜 תסריט</button>
          </div>
          <div className="absolute top-6 left-3 z-20">
            <button onClick={() => useStudio.getState().go('home')} className="w-9 h-9 rounded-full bg-black/40 text-lg" aria-label="סגור">✕</button>
          </div>
          <div className="absolute right-2 top-20 z-20 flex flex-col gap-3">
            <RailButton icon="🔄" label="היפוך" onClick={cam.flip} />
            {cam.lensCount > 2 && <RailButton icon="◎" label="עדשה" onClick={cam.nextLens} />}
            <RailButton icon="⏱" label="טיימר" on={timerOn} onClick={() => setTimerOn((x) => !x)} />
            <RailButton icon="📜" label="פרומפטר" on={prompter.show} onClick={() => setPrompter((p) => ({ ...p, show: !p.show }))} />
            <RailButton icon={fit === 'cover' ? '⤡' : '⤢'} label={fit === 'cover' ? 'מסך מלא' : 'כל הפריים'} onClick={() => setFit((f) => (f === 'cover' ? 'contain' : 'cover'))} />
          </div>
        </>
      )}

      {countdown > 0 && <div className="absolute inset-0 z-30 flex items-center justify-center text-[120px] font-extrabold drop-shadow-2xl animate-pop" key={countdown}>{countdown}</div>}

      <div className="absolute bottom-0 inset-x-0 pb-[max(env(safe-area-inset-bottom),18px)] pt-10 bg-gradient-to-t from-black/60 to-transparent z-20">
        {zoom.range && idle && (
          <div className="flex justify-center gap-2 mb-4">
            {[zoom.range.min, Math.min(zoom.range.max, zoom.range.min * 2)].map((z) => (
              <button key={z} onClick={() => zoom.setZoom(z)} className={`w-10 h-10 rounded-full text-xs font-bold ${Math.abs(zoom.zoom - z) < 0.05 ? 'bg-white text-black' : 'bg-black/45'}`}>
                {(z / zoom.range.min).toFixed(z === zoom.range.min ? 0 : 0)}x
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between px-8">
          <div className="w-16 flex justify-center">
            {hasClips && idle && (
              <button onClick={onDelete} className={`h-11 rounded-full px-3 text-sm font-semibold ${confirmDelete ? 'bg-red-500' : 'bg-black/50'}`} aria-label="מחק קטע אחרון">
                {confirmDelete ? 'למחוק?' : '⌫'}
              </button>
            )}
          </div>
          <RecordButton recording={r.recording} onStart={start} onStop={r.pause} disabled={!cam.stream || r.totalSec >= maxSec || countdown > 0} />
          <div className="w-16 flex justify-center">
            {hasClips && idle ? (
              <button onClick={r.finish} className="w-11 h-11 rounded-full bg-[#fe2c55] text-xl font-bold" aria-label="סיום ומעבר לעריכה">✓</button>
            ) : (
              idle && (
                <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center gap-1" aria-label="העלאה">
                  <span className="w-10 h-10 rounded-lg border-2 border-white bg-gradient-to-br from-pink-400 to-violet-500" />
                  <span className="text-[11px] font-semibold">העלאה</span>
                </button>
              )
            )}
          </div>
        </div>
        <div className="flex justify-center gap-5 mt-4 text-sm font-semibold">
          {r.recording ? (
            <span className="font-mono">{r.totalSec.toFixed(1)}s</span>
          ) : (
            DURATIONS.map((d) => (
              <button key={d.id} disabled={hasClips} onClick={() => setMaxSec(d.id)} className={maxSec === d.id ? 'text-white' : 'text-white/50'}>
                {d.label}
              </button>
            ))
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={onFile} />

      {editing && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">תסריט / נקודות דיבור</h2>
            <button onClick={() => { setEditing(false); setPrompter((p) => ({ ...p, show: true })); }} className="chip chip-on">סיום</button>
          </div>
          <Chips options={[{ id: 'script', label: 'תסריט מלא' }, { id: 'bullets', label: 'נקודות' }]} value={prompter.mode} onChange={(mode) => setPrompter((p) => ({ ...p, mode }))} />
          <textarea value={script} onChange={(e) => setScript(e.target.value)} className="input flex-1 mt-4 text-lg leading-relaxed resize-none" placeholder="כתוב כאן מה תגיד..." />
          <Slider label="קצב גלילה (כשאין זיהוי דיבור)" value={prompter.wpm} min={80} max={220} step={5} onChange={(wpm) => setPrompter((p) => ({ ...p, wpm }))} format={(v) => `${v} מ׳/ד׳`} />
          <Slider label="גודל טקסט" value={prompter.fontSize} min={16} max={36} step={1} onChange={(fontSize) => setPrompter((p) => ({ ...p, fontSize }))} format={(v) => `${v}px`} />
        </div>
      )}
    </div>
  );
}
