// פס התקדמות מחולק לקטעים, כמו בטיקטוק
export default function ClipProgress({ clips, current, recording, maxSec }) {
  const pct = (s) => `${(s / maxSec) * 100}%`;
  return (
    <div className="flex h-1.5 w-full rounded-full bg-white/25 overflow-hidden gap-[2px]">
      {clips.map((c) => (
        <div key={c.id} className="h-full bg-[#fe2c55]" style={{ width: pct(c.end - c.start) }} />
      ))}
      {recording && <div className="h-full bg-[#fe2c55] animate-pulse" style={{ width: pct(current) }} />}
    </div>
  );
}
