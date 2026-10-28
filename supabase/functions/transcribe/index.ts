// Edge Function: תמלול עם חותמות זמן למילים (Whisper verbose_json + word timestamps)
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const form = await req.formData();
  const file = form.get('file') as File;

  const body = new FormData();
  body.append('file', file);
  body.append('model', 'whisper-1');
  body.append('language', 'he');
  body.append('response_format', 'verbose_json');
  body.append('timestamp_granularities[]', 'word');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}` },
    body,
  });
  const data = await res.json();
  const words = (data.words ?? []).map((w: any) => ({ text: w.word, start: w.start, end: w.end }));
  return Response.json({ words, text: data.text }, { headers: cors });
});
