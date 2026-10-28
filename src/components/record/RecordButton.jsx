// כפתור Hold-to-record עם טבעת התקדמות
export default function RecordButton({ recording, elapsed, maxSec, onStart, onStop, disabled }) {
  const r = 38;
  const c = 2 * Math.PI * r;
  const p = Math.min(elapsed / maxSec, 1);
  const prevent = (e) => e.preventDefault();

  return (
    <button
      disabled={disabled}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onStart(); }}
      onPointerUp={onStop}
      onPointerCancel={onStop}
      onContextMenu={prevent}
      className="relative w-24 h-24 touch-none select-none disabled:opacity-40"
      aria-label="החזק כדי להקליט"
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 84 84">
        <circle cx="42" cy="42" r={r} stroke="rgba(255,255,255,.35)" strokeWidth="5" fill="none" />
        <circle cx="42" cy="42" r={r} stroke="#fe2c55" strokeWidth="5" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - p)} strokeLinecap="round" />
      </svg>
      <span className={`absolute inset-0 m-auto rounded-full bg-[#fe2c55] transition-all duration-200 ${recording ? 'w-10 h-10 rounded-xl' : 'w-[68px] h-[68px]'}`} />
    </button>
  );
}
