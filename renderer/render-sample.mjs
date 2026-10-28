import { readFileSync } from 'node:fs';
import { renderJob } from './render-lib.mjs';

const job = JSON.parse(readFileSync(new URL('./sample-job.json', import.meta.url)));
job.output = { ...job.output, ...(process.env.SAMPLE_SMALL ? { width: 540, height: 960 } : {}) };
const out = await renderJob(job, { outPath: process.argv[2] ?? 'out/sample.mp4', onProgress: (p) => process.stdout.write(`\r${Math.round(p * 100)}%`) });
console.log(`\n✓ ${out}`);
