// Edge Function: מקבל פקודת רינדור ומעביר לשירות הרינדור (Remotion).
// Edge Functions מוגבלות בזמן ריצה, לכן הרינדור עצמו רץ בשירות חיצוני שמעדכן את render_jobs.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const job = await req.json();
  if (job?.schemaVersion !== '1.0.0' || !job.source?.url) {
    return Response.json({ error: 'invalid render job' }, { status: 400, headers: cors });
  }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  // 1. אם יש בקשה חופשית – מתרגמים אותה לפעולות עריכה (LLM) וממזגים לפקודה
  if (job.ai?.customPrompt) {
    job.ai.resolvedActions = await resolvePrompt(job.ai.customPrompt);
  }

  await admin.from('render_jobs').update({ status: 'rendering', progress: 0.3, payload: job }).eq('id', job.jobId);

  // 2. שליחה לשירות הרינדור (renderer/server.mjs). הוא מעדכן את render_jobs בעצמו עד status=done
  const rendererUrl = Deno.env.get('RENDERER_URL');
  if (rendererUrl) {
    await fetch(`${rendererUrl}/render`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${Deno.env.get('RENDERER_TOKEN') ?? ''}` },
      body: JSON.stringify({ job }),
    });
  }

  return Response.json({ status: 'rendering', jobId: job.jobId }, { headers: cors });
});

// מקום לחיבור מודל שפה שמחזיר פעולות מובנות, למשל:
// [{ op: 'setFont', value: 'bones' }, { op: 'removeSilences', minMs: 500 }, { op: 'music', track: 'upbeat' }]
async function resolvePrompt(prompt: string) {
  return [{ op: 'note', value: prompt }];
}
