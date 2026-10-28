// Edge Function: "במאי ה-AI". מקבל תמלול עם זמנים, פריימים מהסרטון, בקשה חופשית וסרטון השראה,
// ומחזיר EditPlan (ראה src/lib/director/plan.js). הלקוח מנקה את התוצאה עם sanitizePlan.
// secrets: ANTHROPIC_API_KEY
import Anthropic from 'npm:@anthropic-ai/sdk';

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };
const client = new Anthropic();

const hex = { type: 'string', pattern: '^#[0-9a-fA-F]{6}$' };
const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'style', 'captions', 'hook', 'moments', 'emphasis', 'cuts', 'music', 'transitions', 'cta'],
  properties: {
    summary: { type: 'string', description: 'Short Hebrew explanation of the editing choices, for the user' },
    style: {
      type: 'object', additionalProperties: false, required: ['presetId', 'font', 'primary', 'secondary', 'accent'],
      properties: { presetId: { type: 'string' }, font: { enum: ['heebo', 'elegant', 'display', 'bones'] }, primary: hex, secondary: hex, accent: hex },
    },
    captions: {
      type: 'object', additionalProperties: false,
      required: ['enabled', 'mode', 'position', 'size', 'color', 'highlightColor', 'maxWordsPerLine', 'emphasisStyle'],
      properties: {
        enabled: { type: 'boolean' }, mode: { enum: ['karaoke', 'word', 'sentence'] }, position: { enum: ['top', 'center', 'bottom'] },
        size: { enum: ['sm', 'md', 'lg'] }, color: hex, highlightColor: hex, maxWordsPerLine: { type: 'integer' }, emphasisStyle: { enum: ['color', 'box', 'scale'] },
      },
    },
    hook: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['text', 'start', 'end'], properties: { text: { type: 'string' }, start: { type: 'number' }, end: { type: 'number' } } }] },
    moments: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['kind', 't', 'end', 'value', 'scale', 'position'],
        properties: {
          kind: { enum: ['zoom', 'emoji', 'text'] }, t: { type: 'number' }, end: { type: 'number' },
          value: { type: 'string', description: 'emoji character, or short sticker text; empty for zoom' },
          scale: { type: 'number', description: 'zoom only, 1.03-1.3' },
          position: { enum: ['top', 'center', 'bottom', 'top-right', 'top-left'] },
        },
      },
    },
    emphasis: { type: 'array', items: { type: 'integer' }, description: 'indexes (i) of words to emphasize' },
    cuts: { type: 'object', additionalProperties: false, required: ['removeSilences', 'silenceThresholdMs'], properties: { removeSilences: { type: 'boolean' }, silenceThresholdMs: { type: 'integer' } } },
    music: { type: 'object', additionalProperties: false, required: ['track', 'volume'], properties: { track: { enum: ['none', 'upbeat', 'chill', 'corporate'] }, volume: { type: 'number' } } },
    transitions: { type: 'object', additionalProperties: false, required: ['type', 'intensity'], properties: { type: { enum: ['cut', 'zoom-in', 'zoom-out', 'fade'] }, intensity: { type: 'number' } } },
    cta: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['text'], properties: { text: { type: 'string' } } }] },
  },
};

const SYSTEM = `You are a senior short-form video editor (TikTok / Reels) for small businesses in Israel.
You receive a raw talking-head video as frames plus a word-level Hebrew transcript (i = index, w = word, s/e = seconds),
the owner's free-text request, and optionally frames from an inspiration video they liked.
Produce a complete edit plan, as an editor would, without asking questions:
- Read what is said. Pick the hook (a punchy 2-6 word opening title), the words worth emphasizing (prices, numbers, offers, the key benefit), and a call to action if the speaker invites viewers to act.
- Zoom only on real emphasis moments (at most one every 3-4 seconds; none if the request says no zoom). Never zoom periodically.
- Emoji or sticker pop-ups only where they add meaning, each lasting about 1-1.5 seconds; do not crowd them.
- If inspiration frames are given, match their look: caption style and placement, font feel, colors, pacing, sticker usage.
- The owner's request always wins over your taste. Later requests in the list are corrections and override earlier ones.
- If a previous plan is given, change only what the newest request asks for and keep the rest.
- All visible text (hook, stickers, cta, summary) in Hebrew. Times are in seconds of the original video.
Font ids: heebo = clean, elegant = serif luxury, display = heavy bold, bones = playful hand-drawn.`;

const toImage = (dataUrl: string) => ({
  type: 'image' as const,
  source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: dataUrl.replace(/^data:image\/\w+;base64,/, '') },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { words, durationSec, prompt, niche, frames = [], inspiration, previousPlan } = await req.json();
  const prompts: string[] = Array.isArray(prompt) ? prompt : prompt ? [prompt] : [];

  const content: Anthropic.Beta.BetaContentBlockParam[] = [
    { type: 'text', text: `Video frames (${frames.length}, evenly spaced over ${durationSec?.toFixed?.(1)}s):` },
    ...frames.slice(0, 8).map(toImage),
  ];
  if (inspiration?.frames?.length) {
    content.push({ type: 'text', text: `Inspiration video frames (match this style). Local analysis: pace=${inspiration.pace}, palette=${(inspiration.palette ?? []).join(',')}` });
    content.push(...inspiration.frames.slice(0, 8).map(toImage));
  }
  content.push({
    type: 'text',
    text: [
      `Business type: ${niche ?? 'general'}`,
      `Transcript: ${JSON.stringify(words)}`,
      `Owner requests (oldest first): ${prompts.length ? JSON.stringify(prompts) : 'none – use your judgment for a strong TikTok edit'}`,
      previousPlan ? `Previous plan: ${JSON.stringify(previousPlan)}` : '',
    ].join('\n'),
  });

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    } as Anthropic.Beta.MessageCreateParamsNonStreaming);

    if (response.stop_reason === 'refusal') return Response.json({ error: 'refused' }, { status: 422, headers: cors });
    const text = response.content.find((b) => b.type === 'text');
    const plan = text && 'text' in text ? JSON.parse(text.text) : null;
    return Response.json({ plan }, { headers: cors });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return Response.json({ error: 'rate_limited' }, { status: 429, headers: cors });
    if (e instanceof Anthropic.APIError) return Response.json({ error: e.message }, { status: e.status ?? 500, headers: cors });
    return Response.json({ error: String(e) }, { status: 500, headers: cors });
  }
});
