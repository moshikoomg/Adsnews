// Edge Function: מפיץ את הסרטון המרונדר לרשתות.
// כל פלטפורמה דורשת OAuth משלה; כאן נקודת החיבור (או דרך שירות כמו Metricool / Ayrshare).
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' };

const adapters: Record<string, (post: any, videoUrl: string) => Promise<{ ok: boolean; id?: string }>> = {
  tiktok: async () => ({ ok: true }), // TikTok Content Posting API
  instagram: async () => ({ ok: true }), // Instagram Graph API – media_type=REELS
  youtube: async () => ({ ok: true }), // YouTube Data API – videos.insert (#Shorts)
  facebook: async () => ({ ok: true }),
  linkedin: async () => ({ ok: true }),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  const { videoUrl, posts } = await req.json();
  const results = await Promise.all(posts.map(async (p: any) => ({ platform: p.platform, ...(await adapters[p.platform]?.(p, videoUrl)) })));
  return Response.json({ results }, { headers: cors });
});
