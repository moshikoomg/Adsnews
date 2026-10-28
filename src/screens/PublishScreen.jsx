import { useEffect, useMemo, useRef, useState } from 'react';
import { useStudio } from '../store/useStudio';
import { buildRenderJob, dispatchRenderJob, publishToPlatforms } from '../lib/dispatch';
import { PLATFORMS, NICHE_PACKS } from '../lib/presets';

const STAGE_LABEL = {
  upload: 'מעלה', queue: 'בתור', queued: 'בתור', transcribe: 'מתמלל', cut: 'חותך', captions: 'כתוביות',
  overlays: 'אלמנטים', encode: 'מקודד', rendering: 'מרנדר', done: 'הסרטון מוכן', failed: 'נכשל',
};

// טקסט לפוסט והאשטגים – נגזרים מהעריכה ומהתמלול
function suggestPost(settings, words) {
  const plan = settings.plan;
  const text = [plan?.hook?.text, plan?.cta?.text].filter(Boolean).join(' · ');
  const pack = NICHE_PACKS[settings.brand.niche];
  const kw = [...new Set(words.map((w) => w.text.replace(/[^\p{L}\p{N}]/gu, '')).filter((w) => w.length > 3))].slice(0, 3);
  const tags = ['פוריו', 'עסקיםקטנים', ...(pack && settings.brand.niche !== 'general' ? [pack.label.replace(/[^\p{L}]/gu, '')] : []), ...kw];
  return { text, tags };
}

// מסך הפרסום – כמו "פוסט" בטיקטוק
export default function PublishScreen() {
  const { source, words, settings, go, setJob, render, setRender } = useStudio();
  const initial = useMemo(() => suggestPost(settings, words), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [targets, setTargets] = useState(['tiktok', 'instagram', 'youtube']);
  const [caption, setCaption] = useState(`${initial.text}\n${initial.tags.map((t) => `#${t}`).join(' ')}`.trim());
  const [showJson, setShowJson] = useState(false);
  const [published, setPublished] = useState(null);
  const coverRef = useRef(null);

  const job = useMemo(() => buildRenderJob({ source, words, settings, publishTargets: targets }), [source, words, settings, targets]);

  useEffect(() => {
    if (render.stage) return;
    setJob(job);
    setRender({ stage: 'upload', progress: 0, error: null });
    dispatchRenderJob({ job, blob: source.blob, onProgress: (p) => setRender(p) })
      .then((result) => setRender({ stage: result.status, progress: 1, result }))
      .catch((e) => setRender({ stage: 'failed', error: e.message }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = coverRef.current;
    if (v) v.currentTime = Math.min(1, (source.durationSec || 2) / 2);
  }, [source]);

  const done = render.stage === 'done';
  const toggle = (id) => setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  const back = () => {
    setRender({ stage: null, progress: 0, result: null, error: null });
    go('editor');
  };

  const onPublish = async () => {
    const hashtags = (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => h.slice(1));
    const res = await publishToPlatforms({ jobId: job.jobId, outputUrl: render.result?.outputUrl, targets, caption: caption.replace(/#[\p{L}\p{N}_]+/gu, '').trim(), hashtags });
    setPublished(res);
  };

  return (
    <div className="h-full flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)] pb-3 border-b border-white/10">
        <button onClick={back} className="text-2xl w-8" aria-label="חזרה">›</button>
        <span className="font-bold">פוסט</span>
        <button onClick={() => setShowJson((x) => !x)} className="text-xs text-white/50 w-8">{'{ }'}</button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex gap-3 p-4">
          <textarea
            id="post-caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={6}
            placeholder="תאר את הסרטון..."
            className="flex-1 bg-transparent outline-none resize-none text-[15px] leading-relaxed"
          />
          <div className="relative w-28 shrink-0">
            {render.result?.outputUrl ? (
              <video src={render.result.outputUrl} controls playsInline className="w-28 aspect-[9/16] object-cover rounded-lg bg-neutral-900" />
            ) : (
              <video ref={coverRef} src={source.url} muted playsInline className={`w-28 aspect-[9/16] object-cover rounded-lg bg-neutral-900 ${source.origin === 'camera' && source.mirrored !== false ? '-scale-x-100' : ''}`} />
            )}
            <div className="absolute bottom-0 inset-x-0 bg-black/60 rounded-b-lg text-[10px] text-center py-1">
              {done ? 'מוכן ✓' : `${STAGE_LABEL[render.stage] ?? '...'} ${Math.round((render.progress ?? 0) * 100)}%`}
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-4">
          <button onClick={() => setCaption((c) => `${c} #`)} className="chip text-xs"># האשטגים</button>
          <button onClick={() => setCaption((c) => `${c} @`)} className="chip text-xs">@ תיוג</button>
        </div>

        {render.error && <p className="text-red-400 text-sm px-4 mt-3">{render.error}</p>}
        {render.result?.mock && <p className="text-amber-300/80 text-xs px-4 mt-3">רינדור לדוגמה: חבר את השרת כדי לקבל קובץ סופי.</p>}

        <div className="mt-5 border-t border-white/10">
          {[['📍', 'מיקום'], ['👁', 'כולם יכולים לצפות בסרטון'], ['💬', 'תגובות מותרות']].map(([i, l]) => (
            <div key={l} className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 text-sm">
              <span>{i} {l}</span>
              <span className="text-white/40">‹</span>
            </div>
          ))}
        </div>

        <div className="px-4 mt-5">
          <div className="text-xs text-white/50 mb-2">שתף ל:</div>
          <div className="flex gap-3 flex-wrap">
            {PLATFORMS.map((p) => (
              <button key={p.id} onClick={() => toggle(p.id)} className={`flex flex-col items-center gap-1 w-16 ${targets.includes(p.id) ? '' : 'opacity-35'}`}>
                <span className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${targets.includes(p.id) ? 'bg-white/15 ring-2 ring-[#fe2c55]' : 'bg-white/10'}`}>{p.emoji}</span>
                <span className="text-[10px] text-center leading-tight">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {showJson && (
          <pre dir="ltr" className="m-4 text-[10px] leading-4 bg-neutral-900 rounded-2xl p-4 max-h-80 overflow-auto text-left">
            {JSON.stringify({ ...job, captions: job.captions && { ...job.captions, words: `[${job.captions.words.length} words]`, lines: `[${job.captions.lines.length} lines]` } }, null, 2)}
          </pre>
        )}

        {published && (
          <div className="m-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 p-4 text-sm">
            ✓ הוכן לפרסום ב-{published.payload.posts.length} פלטפורמות{published.mock ? ' (הדגמה)' : ''}.
            <button onClick={() => go('record')} className="block mt-3 underline">צלם סרטון חדש</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 p-3 pb-[max(env(safe-area-inset-bottom),12px)] border-t border-white/10">
        <button onClick={back} className="flex-1 rounded-lg bg-white/10 py-3 font-semibold">📁 טיוטות</button>
        <button onClick={onPublish} disabled={!done || !targets.length || !!published} className="flex-1 rounded-lg bg-[#fe2c55] py-3 font-bold disabled:opacity-40">
          ↑ פרסם
        </button>
      </div>
    </div>
  );
}
