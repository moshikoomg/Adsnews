export const segLen = (s) => s.srcEnd - s.srcStart;

// אורך הפלט = סכום המקטעים שנשארו אחרי חיתוך שתיקות
export const jobDurationSec = (job) => {
  const segs = job.timeline.segments;
  const last = segs[segs.length - 1];
  return last ? last.outStart + segLen(last) : job.source.durationSec;
};
