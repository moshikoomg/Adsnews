// שירות רינדור: מקבל RenderJob מה-Edge Function, מרנדר עם Remotion, מעלה ל-Storage ומעדכן את render_jobs
import http from 'node:http';
import { readFile, rm } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { renderJob } from './render-lib.mjs';

const PORT = process.env.PORT ?? 8080;
const TOKEN = process.env.RENDERER_TOKEN;
const supabase = process.env.SUPABASE_URL ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY) : null;

const updateJob = (id, patch) => supabase?.from('render_jobs').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id);

// תור פשוט: רינדור אחד בכל פעם (Remotion כבר מנצל את כל הליבות)
const queue = [];
let busy = false;
async function drain() {
  if (busy || !queue.length) return;
  busy = true;
  const job = queue.shift();
  try {
    await runJob(job);
  } finally {
    busy = false;
    drain();
  }
}

async function runJob(job) {
  const out = `out/${job.jobId}.mp4`;
  let last = 0;
  try {
    await updateJob(job.jobId, { status: 'rendering', progress: 0.3 });
    await renderJob(job, {
      outPath: out,
      onProgress: (p) => {
        const progress = 0.3 + p * 0.6;
        if (progress - last > 0.05) { last = progress; updateJob(job.jobId, { progress }); }
      },
    });
    let output_url = null;
    if (supabase) {
      const key = `rendered/${job.jobId}.mp4`;
      const { error } = await supabase.storage.from('videos').upload(key, await readFile(out), { contentType: 'video/mp4', upsert: true });
      if (error) throw error;
      output_url = supabase.storage.from('videos').getPublicUrl(key).data.publicUrl;
      await rm(out, { force: true });
    }
    await updateJob(job.jobId, { status: 'done', progress: 1, output_url });
    console.log(`✓ ${job.jobId}`, output_url ?? out);
  } catch (e) {
    console.error(`✗ ${job.jobId}`, e);
    await updateJob(job.jobId, { status: 'failed', error: String(e.message ?? e) });
  }
}

http
  .createServer(async (req, res) => {
    const send = (code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };
    if (req.method === 'GET' && req.url === '/health') return send(200, { ok: true, queued: queue.length, busy });
    if (req.method !== 'POST' || req.url !== '/render') return send(404, { error: 'not found' });
    if (TOKEN && req.headers.authorization !== `Bearer ${TOKEN}`) return send(401, { error: 'unauthorized' });

    let raw = '';
    for await (const chunk of req) raw += chunk;
    const { job } = JSON.parse(raw || '{}');
    if (job?.schemaVersion !== '1.0.0' || !job.source?.url) return send(400, { error: 'invalid render job' });

    queue.push(job);
    drain();
    send(202, { accepted: true, jobId: job.jobId, position: queue.length });
  })
  .listen(PORT, () => console.log(`renderer listening on :${PORT}`));
