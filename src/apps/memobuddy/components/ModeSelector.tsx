// src/apps/memobuddy/components/ModeSelector.tsx

interface ModeSelectorProps {
  mode: 'surah' | 'juz' | 'full' | 'custom' | null;
  onSelect: (mode: 'surah' | 'juz' | 'full' | 'custom') => void;
}

export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  const options = [
    { id: 'surah', label: 'Select by Surah' },
    { id: 'juz', label: 'Select by Juz' },
    { id: 'full', label: 'Full Quran' },
    { id: 'custom', label: 'Custom Selection' }
  ] as const;

  return (
    <div className="mb-4 grid grid-cols-2 gap-4">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onSelect(opt.id)}
          className={`
            px-4 py-2 rounded-lg border font-semibold shadow-md transition-all duration-300 ease-in-out
            ${mode === opt.id
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 hover:scale-105 shadow-lg'
              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50 hover:scale-105'}
          `}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}