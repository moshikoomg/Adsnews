import { useRef } from 'react';

const HOLD_MS = 350;

/**
 * כמו בטיקטוק: לחיצה קצרה = התחל/עצור, החזקה = מקליט כל עוד האצבע על הכפתור.
 */
export default function RecordButton({ recording, onStart, onStop, disabled }) {
  const down = useRef(0);
  const wasRecording = useRef(false);

  const onDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    down.current = performance.now();
    wasRecording.current = recording;
    if (!recording) onStart();
  };
  const onUp = () => {
    const held = performance.now() - down.current > HOLD_MS;
    if (wasRecording.current) onStop(); // לחיצה בזמן הקלטה עוצרת
    else if (held) onStop(); // שחרור אחרי החזקה עוצר
    // לחיצה קצרה כשלא הקליט: ממשיך להקליט עד הלחיצה הבאה
  };

  return (
    <button
      disabled={disabled}
      onPointerDown={onDown}
      onPointerUp={onUp}
      onPointerCancel={() => recording && onStop()}
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-24 h-24 touch-none select-none disabled:opacity-40"
      aria-label="לחץ או החזק כדי להקליט"
    >
      <span className={`absolute inset-0 rounded-full border-[6px] transition ${recording ? 'border-[#fe2c55]/50 scale-110' : 'border-white/70'}`} />
      <span className={`absolute inset-0 m-auto bg-[#fe2c55] transition-all duration-200 ${recording ? 'w-9 h-9 rounded-lg' : 'w-[70px] h-[70px] rounded-full'}`} />
    </button>
  );
}
