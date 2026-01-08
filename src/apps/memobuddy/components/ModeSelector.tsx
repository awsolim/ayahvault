// src/apps/memobuddy/components/ModeSelector.tsx

interface ModeSelectorProps {
  mode: 'surah' | 'juz' | 'full' | 'custom' | null;
  onSelect: (mode: 'surah' | 'juz' | 'full' | 'custom') => void;
}

export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return (
    <div className="mb-4 flex flex-wrap justify-center gap-3">
      {(['surah','juz', 'full', 'custom'] as const).map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`
            px-4 py-2 rounded-lg border text-sm font-semibold shadow-md transition-all duration-300 ease-in-out
            ${mode === m
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 hover:scale-105 shadow-lg'
              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50 hover:scale-105'}
          `}
        >
          {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}