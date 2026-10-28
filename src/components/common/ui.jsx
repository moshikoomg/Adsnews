export function Chips({ options, value, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} className={`chip ${value === o.id ? 'chip-on' : ''}`}>
          {o.emoji ? `${o.emoji} ` : ''}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition relative ${checked ? 'bg-pink-500' : 'bg-white/20'}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${checked ? 'right-0.5' : 'right-[22px]'}`} />
      </button>
    </label>
  );
}

export function ColorField({ label, value, onChange }) {
  return (
    <label className="flex flex-col items-center gap-1 text-[11px] text-white/60">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 bg-transparent cursor-pointer" />
      {label}
    </label>
  );
}

export function Slider({ label, value, min = 0, max = 1, step = 0.05, onChange, format = (v) => v }) {
  return (
    <label className="block py-1">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="text-white/50">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-pink-500" />
    </label>
  );
}

export function Section({ title, children }) {
  return (
    <div className="mb-5">
      <span className="label">{title}</span>
      {children}
    </div>
  );
}

export function IconButton({ children, onClick, className = '', ...rest }) {
  return (
    <button onClick={onClick} className={`w-11 h-11 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-lg active:scale-90 transition ${className}`} {...rest}>
      {children}
    </button>
  );
}
