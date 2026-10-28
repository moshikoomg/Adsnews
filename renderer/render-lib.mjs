import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';

const root = path.dirname(fileURLToPath(import.meta.url));

// ספריית מוזיקה: מזהה רצועה → URL. אפשר לדרוס דרך MUSIC_LIBRARY='{"upbeat":"https://..."}'
const MUSIC = JSON.parse(process.env.MUSIC_LIBRARY || '{}');

// אפשר להצביע על Chrome קיים (למשל בתוך Docker) במקום ש-Remotion יוריד אחד
const browserExecutable = process.env.REMOTION_BROWSER || (existsSync(process.env.PW_HEADLESS_SHELL ?? '') ? process.env.PW_HEADLESS_SHELL : null);

let bundlePromise;
const getBundle = () =>
  (bundlePromise ??= bundle({ entryPoint: path.join(root, 'src/index.jsx'), publicDir: path.join(root, 'public') }));

// מרנדר RenderJob אחד לקובץ MP4
export async function renderJob(job, { outPath, onProgress } = {}) {
  const prepared = structuredClone(job);
  const music = prepared.audio?.music;
  if (music && !music.url) music.url = MUSIC[music.track] ?? null;

  const serveUrl = await getBundle();
  const inputProps = { job: prepared };
  const composition = await selectComposition({ serveUrl, id: 'RenderJob', inputProps, browserExecutable });

  const output = outPath ?? path.join(root, 'out', `${job.jobId}.mp4`);
  await renderMedia({
    serveUrl,
    composition,
    inputProps,
    codec: 'h264',
    outputLocation: output,
    browserExecutable,
    chromiumOptions: { gl: 'swangle' },
    onProgress: ({ progress }) => onProgress?.(progress),
  });
  return output;
}
