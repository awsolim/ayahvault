// src/apps/memobuddy/components/ModeSelector.tsx

interface ModeSelectorProps {
  mode: 'surah' | 'juz' | 'full' | 'custom' | null;
  onSelect: (mode: 'surah' | 'juz' | 'full' | 'custom') => void;
}

export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return (
    <div className="mb-6 grid grid-cols-4 gap-1 w-full">
      {(['surah','juz', 'full', 'custom'] as const).map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`
            py-2.5 rounded-lg border text-[10px] sm:text-xs font-bold shadow-sm transition-all duration-200
            flex items-center justify-center text-center whitespace-nowrap
            ${mode === m
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-md ring-1 ring-emerald-300'
              : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'}
          `}
        >
          {m.toUpperCase()}
        </button>
      ))}
    </div>
  );
}