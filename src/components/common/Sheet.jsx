// מגירה תחתונה שנפתחת מעל הנגן (כמו בטיקטוק). לחיצה על הרקע סוגרת
export default function Sheet({ open, onClose, title, children, tall }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={onClose}>
      <div
        className={`rounded-t-3xl bg-neutral-950/95 backdrop-blur-xl border-t border-white/10 flex flex-col animate-up ${tall ? 'h-[78%]' : 'max-h-[62%]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="font-bold">{title}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10" aria-label="סגור">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-8 no-scrollbar">{children}</div>
      </div>
    </div>
  );
}
