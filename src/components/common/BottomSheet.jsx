import { useRef, useState } from 'react';

// מגירה תחתונה עם שתי נקודות עצירה (חצי / מלא) וגרירה
export default function BottomSheet({ children, header }) {
  const [expanded, setExpanded] = useState(false);
  const [drag, setDrag] = useState(0);
  const startY = useRef(null);

  const onDown = (e) => (startY.current = e.clientY);
  const onMove = (e) => startY.current !== null && setDrag(e.clientY - startY.current);
  const onUp = () => {
    if (drag < -40) setExpanded(true);
    if (drag > 40) setExpanded(false);
    startY.current = null;
    setDrag(0);
  };

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 flex flex-col transition-[height] duration-300"
      style={{ height: expanded ? '82%' : '46%', transform: `translateY(${Math.max(drag, -60)}px)` }}
    >
      <div
        className="pt-2 pb-1 cursor-grab touch-none"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onClick={() => Math.abs(drag) < 3 && setExpanded((x) => !x)}
      >
        <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25" />
      </div>
      {header}
      <div className="flex-1 overflow-y-auto px-4 pb-28 no-scrollbar">{children}</div>
    </div>
  );
}
