// "זוג עיניים" ממוקם צמוד לעדשה הקדמית כדי למשוך את המבט למצלמה
export default function EyesIndicator({ recording }) {
  return (
    <div className="absolute top-[max(env(safe-area-inset-top),8px)] inset-x-0 flex flex-col items-center z-20 pointer-events-none">
      <div className={`flex gap-2 px-3 py-1.5 rounded-full ${recording ? 'bg-red-500/80' : 'bg-black/50'} backdrop-blur transition`}>
        {[0, 1].map((i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-white flex items-center justify-center animate-blink">
            <div className="w-3 h-3 rounded-full bg-black translate-y-[-2px]" />
          </div>
        ))}
      </div>
      <span className="text-[10px] mt-1 text-white/80 drop-shadow">↑ הסתכל כאן</span>
    </div>
  );
}
