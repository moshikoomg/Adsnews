import { supabase } from './supabase';
export { buildRenderJob, RENDER_SCHEMA_VERSION } from './renderJob';

/**
 * שולח את פקודת הרינדור ל-Backend.
 * Supabase: מעלה את הקובץ ל-Storage, שומר שורה ב-render_jobs ומפעיל Edge Function.
 * Mock: מדמה התקדמות מקומית.
 */
export async function dispatchRenderJob({ job, blob, onProgress }) {
  if (!supabase) return mockRender(job, onProgress);

  const path = `raw/${job.jobId}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
  onProgress?.({ stage: 'upload', progress: 0.05 });
  const up = await supabase.storage.from('videos').upload(path, blob, { contentType: blob.type });
  if (up.error) throw up.error;
  const { data: pub } = supabase.storage.from('videos').getPublicUrl(path);
  job.source.url = pub.publicUrl;

  onProgress?.({ stage: 'queue', progress: 0.2 });
  const { error } = await supabase.from('render_jobs').insert({ id: job.jobId, status: 'queued', payload: job });
  if (error) throw error;

  const { data, error: fnErr } = await supabase.functions.invoke('render-video', { body: job });
  if (fnErr) throw fnErr;

  // מעקב סטטוס בזמן אמת
  return new Promise((resolve) => {
    const ch = supabase
      .channel(`job-${job.jobId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'render_jobs', filter: `id=eq.${job.jobId}` }, ({ new: row }) => {
        onProgress?.({ stage: row.status, progress: row.progress ?? 0.5 });
        if (row.status === 'done' || row.status === 'failed') {
          supabase.removeChannel(ch);
          resolve({ status: row.status, outputUrl: row.output_url, jobId: job.jobId });
        }
      })
      .subscribe();
    if (data?.status === 'done') resolve({ status: 'done', outputUrl: data.outputUrl, jobId: job.jobId });
  });
}

function mockRender(job, onProgress) {
  const stages = ['upload', 'transcribe', 'cut', 'captions', 'overlays', 'encode', 'done'];
  return new Promise((resolve) => {
    let i = 0;
    const t = setInterval(() => {
      i++;
      onProgress?.({ stage: stages[i], progress: i / (stages.length - 1) });
      if (i >= stages.length - 1) {
        clearInterval(t);
        resolve({ status: 'done', outputUrl: null, jobId: job.jobId, mock: true });
      }
    }, 600);
  });
}

// מכין את הסרטון להפצה: כיתוב, האשטגים ותזמון לכל פלטפורמה
export async function publishToPlatforms({ jobId, outputUrl, targets, caption, hashtags }) {
  const payload = {
    jobId,
    videoUrl: outputUrl,
    posts: targets.map((platform) => ({
      platform,
      caption: platform === 'linkedin' ? caption : `${caption}\n\n${hashtags.map((h) => `#${h}`).join(' ')}`,
      scheduleAt: null,
    })),
  };
  if (!supabase) {
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true, mock: true, payload };
  }
  const { data, error } = await supabase.functions.invoke('publish-video', { body: payload });
  if (error) throw error;
  return { ok: true, ...data, payload };
}
