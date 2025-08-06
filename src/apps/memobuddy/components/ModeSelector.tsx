// src/apps/memobuddy/components/ModeSelector.tsx

interface ModeSelectorProps {
  mode: 'surah' | 'juz' | null;
  onSelect: (mode: 'surah' | 'juz') => void;
}

/** Renders the two big buttons to pick Surah vs Juz */
export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return (
    <div className="mb-4 flex space-x-4">
      {(['surah','juz'] as const).map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`
            px-4 py-2 rounded-lg border font-semibold shadow-md transition-all duration-300 ease-in-out
            ${mode === m
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 hover:scale-105 shadow-lg'
              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50 hover:scale-105'}
          `}
        >
          Select by {m.charAt(0).toUpperCase() + m.slice(1)}
        </button>
      ))}
    </div>
  );
}
