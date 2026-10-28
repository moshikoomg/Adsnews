import { useEffect, useMemo, useState } from 'react';
import { useStudio } from '../store/useStudio';
import { buildRenderJob, dispatchRenderJob, publishToPlatforms } from '../lib/dispatch';
import { PLATFORMS } from '../lib/presets';

const STAGE_LABEL = {
  upload: 'מעלה חומר גלם', queue: 'בתור', queued: 'בתור', transcribe: 'מתמלל', cut: 'חותך שתיקות',
  captions: 'מטמיע כתוביות', overlays: 'מוסיף גרפיקה', encode: 'מקודד', rendering: 'מרנדר', done: 'מוכן!', failed: 'נכשל',
};

export default function PublishScreen() {
  const { source, words, settings, go, setJob, render, setRender } = useStudio();
  const [targets, setTargets] = useState(['tiktok', 'instagram', 'youtube']);
  const [caption, setCaption] = useState(settings.brand.businessName ? `חדש ב${settings.brand.businessName}!` : '');
  const [tags, setTags] = useState('עסקים קטנים, טיפים');
  const [showJson, setShowJson] = useState(false);
  const [published, setPublished] = useState(null);

  const job = useMemo(() => buildRenderJob({ source, words, settings, publishTargets: targets }), [source, words, settings, targets]);

  // שיגור הרינדור פעם אחת בכניסה למסך
  useEffect(() => {
    if (render.stage) return;
    setJob(job);
    setRender({ stage: 'upload', progress: 0, error: null });
    dispatchRenderJob({ job, blob: source.blob, onProgress: (p) => setRender(p) })
      .then((result) => setRender({ stage: result.status, progress: 1, result }))
      .catch((e) => setRender({ stage: 'failed', error: e.message }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const done = render.stage === 'done';
  const toggle = (id) => setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  const onPublish = async () => {
    const res = await publishToPlatforms({
      jobId: job.jobId,
      outputUrl: render.result?.outputUrl,
      targets,
      caption,
      hashtags: tags.split(',').map((t) => t.trim().replace(/\s+/g, '_')).filter(Boolean),
    });
    setPublished(res);
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar px-5 pt-5 pb-10">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => { setRender({ stage: null, progress: 0, result: null, error: null }); go('editor'); }} className="chip">→ חזרה לעריכה</button>
        <button onClick={() => setShowJson((x) => !x)} className="chip">{showJson ? 'הסתר' : '{ } JSON'}</button>
      </div>

      <div className="rounded-3xl bg-white/5 border border-white/10 p-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-semibold">{STAGE_LABEL[render.stage] ?? 'מתחיל...'}</span>
          <span className="text-white/50">{Math.round((render.progress ?? 0) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-gradient-to-l from-pink-500 to-violet-500 transition-all" style={{ width: `${(render.progress ?? 0) * 100}%` }} />
        </div>
        {render.result?.outputUrl && <video src={render.result.outputUrl} controls playsInline className="mt-4 w-full rounded-2xl aspect-[9/16] bg-black" />}
        {render.error && <p className="text-red-400 text-sm mt-2">{render.error}</p>}
        {render.result?.mock && <p className="text-amber-300/80 text-xs mt-2">רינדור מדומה. חבר Supabase + Edge Function כדי לקבל קובץ אמיתי.</p>}
        <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs text-white/60">
          <div><b className="block text-lg text-white">{job.timeline.segments.length}</b>מקטעים</div>
          <div><b className="block text-lg text-white">{job.captions?.words.length ?? 0}</b>מילים</div>
          <div><b className="block text-lg text-white">{job.overlays.length}</b>שכבות</div>
        </div>
      </div>

      {showJson && (
        <div className="mt-4 relative">
          <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(job, null, 2))} className="chip absolute top-2 right-2 text-xs">העתק</button>
          <pre dir="ltr" className="text-[10px] leading-4 bg-neutral-900 rounded-2xl p-4 max-h-80 overflow-auto text-left">{JSON.stringify({ ...job, captions: job.captions && { ...job.captions, words: `[${job.captions.words.length} words]` } }, null, 2)}</pre>
        </div>
      )}

      <h2 className="text-lg font-bold mt-7 mb-3">הפצה</h2>
      <div className="grid grid-cols-2 gap-2">
        {PLATFORMS.map((p) => (
          <button key={p.id} onClick={() => toggle(p.id)} className={`rounded-2xl p-3 text-right border text-sm transition ${targets.includes(p.id) ? 'border-pink-400 bg-pink-500/15' : 'border-white/10 bg-white/5 text-white/60'}`}>
            {p.emoji} {p.label}
          </button>
        ))}
      </div>
      <textarea rows={3} className="input mt-4 resize-none" placeholder="טקסט לפוסט" value={caption} onChange={(e) => setCaption(e.target.value)} />
      <input className="input mt-2" placeholder="האשטגים, מופרדים בפסיק" value={tags} onChange={(e) => setTags(e.target.value)} />

      <button onClick={onPublish} disabled={!done || !targets.length || !!published} className="btn-primary mt-5 text-lg">
        🚀 שגר לכל הפלטפורמות
      </button>
      {published && (
        <div className="mt-4 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 p-4 text-sm">
          ✓ הוכן לפרסום ב-{published.payload.posts.length} פלטפורמות{published.mock ? ' (הדגמה)' : ''}.
          <button onClick={() => go('home')} className="block mt-3 underline">סרטון חדש (עם ברירות המחדל שלך)</button>
        </div>
      )}
    </div>
  );
}
