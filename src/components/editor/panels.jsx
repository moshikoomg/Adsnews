import { useState } from 'react';
import { useStudio } from '../../store/useStudio';
import { STYLE_PRESETS, FONTS, NICHE_PACKS, TRANSITIONS, MUSIC } from '../../lib/presets';
import { Chips, Toggle, ColorField, Slider, Section } from '../common/ui';

const useS = () => {
  const settings = useStudio((s) => s.settings);
  const update = useStudio((s) => s.update);
  return [settings, update];
};

export function StylePanel() {
  const [s, update] = useS();
  const applyPreset = useStudio((x) => x.applyPreset);
  return (
    <>
      <Section title="תבנית עסק">
        <div className="grid grid-cols-2 gap-2">
          {STYLE_PRESETS.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p.id)} className={`rounded-2xl p-3 text-right border transition ${s.presetId === p.id ? 'border-pink-400 bg-pink-500/15' : 'border-white/10 bg-white/5'}`}>
              <div className="text-2xl">{p.emoji}</div>
              <div className="text-sm font-semibold mt-1">{p.name}</div>
              <div className="flex gap-1 mt-2">
                {['primary', 'secondary', 'accent'].map((k) => <span key={k} className="w-4 h-4 rounded-full border border-white/20" style={{ background: p.patch.brand[k] }} />)}
              </div>
            </button>
          ))}
        </div>
      </Section>
      <Section title="תחום העסק (אייקונים ייעודיים)">
        <Chips options={Object.entries(NICHE_PACKS).map(([id, p]) => ({ id, label: p.label }))} value={s.brand.niche} onChange={(v) => update('brand.niche', v)} />
      </Section>
      <Section title="שם העסק ולוגו">
        <input className="input mb-2" placeholder="שם העסק" value={s.brand.businessName} onChange={(e) => update('brand.businessName', e.target.value)} />
        <input className="input" placeholder="קישור ללוגו (PNG שקוף)" dir="ltr" value={s.brand.logoUrl} onChange={(e) => update('brand.logoUrl', e.target.value)} />
      </Section>
      <Section title="צבעי מותג">
        <div className="flex gap-5">
          <ColorField label="ראשי" value={s.brand.primary} onChange={(v) => update('brand.primary', v)} />
          <ColorField label="משני" value={s.brand.secondary} onChange={(v) => update('brand.secondary', v)} />
          <ColorField label="הדגשה" value={s.brand.accent} onChange={(v) => update('brand.accent', v)} />
        </div>
      </Section>
      <Section title="פונט">
        <div className="grid grid-cols-2 gap-2">
          {FONTS.map((f) => (
            <button key={f.id} onClick={() => update('brand.font', f.id)} className={`rounded-xl py-3 border text-lg ${s.brand.font === f.id ? 'border-pink-400 bg-pink-500/15' : 'border-white/10 bg-white/5'}`} style={{ fontFamily: f.css }}>
              {f.label}
            </button>
          ))}
        </div>
      </Section>
    </>
  );
}

export function CaptionsPanel() {
  const [s, update] = useS();
  const c = s.captions;
  return (
    <>
      <Toggle label="כתוביות אוטומטיות" checked={c.enabled} onChange={(v) => update('captions.enabled', v)} />
      <Section title="סגנון הדגשה">
        <Chips options={[{ id: 'karaoke', label: 'קריוקי' }, { id: 'word', label: 'מילה-מילה' }, { id: 'sentence', label: 'משפט' }]} value={c.mode} onChange={(v) => update('captions.mode', v)} />
      </Section>
      <Section title="מיקום">
        <Chips options={[{ id: 'top', label: 'עליון' }, { id: 'center', label: 'מרכז' }, { id: 'bottom', label: 'תחתון' }]} value={c.position} onChange={(v) => update('captions.position', v)} />
      </Section>
      <Section title="גודל">
        <Chips options={[{ id: 'sm', label: 'קטן' }, { id: 'md', label: 'בינוני' }, { id: 'lg', label: 'גדול' }]} value={c.size} onChange={(v) => update('captions.size', v)} />
      </Section>
      <Section title="צבעים">
        <div className="flex gap-5">
          <ColorField label="טקסט" value={c.color} onChange={(v) => update('captions.color', v)} />
          <ColorField label="הדגשה" value={c.highlightColor} onChange={(v) => update('captions.highlightColor', v)} />
        </div>
      </Section>
      <Slider label="מילים בשורה" value={c.maxWordsPerLine} min={1} max={8} step={1} onChange={(v) => update('captions.maxWordsPerLine', v)} />
    </>
  );
}

export function TransitionsPanel() {
  const [s, update] = useS();
  const [kw, setKw] = useState('');
  const [src, setSrc] = useState('');
  const addItem = () => {
    if (!kw.trim() || !src.trim()) return;
    const kind = /^https?:/.test(src) ? (/\.(mp4|webm|mov)$/i.test(src) ? 'video' : 'image') : 'emoji';
    update('broll.items', [...s.broll.items, { keyword: kw.trim(), kind, src: src.trim() }]);
    setKw('');
    setSrc('');
  };
  return (
    <>
      <Section title="סוג מעבר">
        <Chips options={TRANSITIONS} value={s.transitions.type} onChange={(v) => update('transitions.type', v)} />
      </Section>
      <Toggle label="Jump-cuts מהירים (זום מתחלף)" checked={s.transitions.jumpCuts} onChange={(v) => update('transitions.jumpCuts', v)} />
      <Slider label="עוצמה" value={s.transitions.intensity} onChange={(v) => update('transitions.intensity', v)} format={(v) => `${Math.round(v * 100)}%`} />
      <div className="h-px bg-white/10 my-4" />
      <Toggle label="אייקונים אוטומטיים לפי מילות מפתח" checked={s.broll.autoKeywords} onChange={(v) => update('broll.autoKeywords', v)} />
      <Section title="B-Roll / גרפיקה לפי מילת מפתח">
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="מילת מפתח" value={kw} onChange={(e) => setKw(e.target.value)} />
          <input className="input flex-[1.4]" placeholder="אמוג'י או URL" value={src} onChange={(e) => setSrc(e.target.value)} />
          <button onClick={addItem} className="chip chip-on">+</button>
        </div>
        <ul className="mt-3 space-y-1.5">
          {s.broll.items.map((it, i) => (
            <li key={i} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
              <span>
                <b>{it.keyword}</b> → {it.kind === 'emoji' ? it.src : `${it.kind}: ${it.src.slice(0, 28)}…`}
              </span>
              <button onClick={() => update('broll.items', s.broll.items.filter((_, j) => j !== i))} className="text-white/50">✕</button>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

export function AudioPanel() {
  const [s, update] = useS();
  return (
    <>
      <Toggle label="חיתוך שתיקות ארוכות" checked={s.audio.removeSilences} onChange={(v) => update('audio.removeSilences', v)} />
      <Slider label="שתיקה מינימלית לחיתוך" value={s.audio.silenceThresholdMs} min={200} max={2000} step={50} onChange={(v) => update('audio.silenceThresholdMs', v)} format={(v) => `${v}ms`} />
      <Section title="מוזיקת רקע">
        <Chips options={MUSIC} value={s.audio.music} onChange={(v) => update('audio.music', v)} />
      </Section>
      <Slider label="עוצמת מוזיקה" value={s.audio.musicVolume} max={0.6} step={0.01} onChange={(v) => update('audio.musicVolume', v)} format={(v) => `${Math.round(v * 100)}%`} />
    </>
  );
}

const SUGGESTIONS = ['שים פונט בסגנון עצמות', 'תחתוך שתיקות ארוכות', 'שים מוזיקת רקע קצבית', 'תוסיף קריאה לפעולה בסוף', 'תדגיש את המחיר בגדול'];

export function PromptPanel() {
  const [s, update] = useS();
  const add = (t) => update('customPrompt', s.customPrompt ? `${s.customPrompt}\n${t}` : t);
  return (
    <>
      <Section title="בקשה חופשית לעורך ה-AI">
        <textarea rows={5} className="input resize-none" placeholder='למשל: "שים פונט בסגנון עצמות ותוסיף זום על המילה מבצע"' value={s.customPrompt} onChange={(e) => update('customPrompt', e.target.value)} />
      </Section>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((t) => <button key={t} onClick={() => add(t)} className="chip">+ {t}</button>)}
      </div>
      <p className="text-xs text-white/40 mt-4">הבקשה נשלחת יחד עם פקודת הרינדור. ב-Backend מודל שפה מתרגם אותה לפעולות עריכה נוספות.</p>
    </>
  );
}
