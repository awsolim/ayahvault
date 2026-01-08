// src/apps/memobuddy/components/ModeSelector.tsx

interface ModeSelectorProps {
  mode: 'surah' | 'juz' | 'full' | 'custom' | null;
  onSelect: (mode: 'surah' | 'juz' | 'full' | 'custom') => void;
}

export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return (
    <div className="mb-6 grid grid-cols-4 gap-1.5 w-full">
      {(['surah','juz', 'full', 'custom'] as const).map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`
            py-2 rounded-lg border text-[11px] sm:text-sm font-bold shadow-md transition-all duration-200 ease-in-out
            flex items-center justify-center text-center
            ${mode === m
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-lg scale-[1.02]'
              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50'}
          `}
        >
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  );
}