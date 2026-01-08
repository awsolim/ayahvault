// src/apps/memobuddy/components/RangeInput.tsx

interface RangeInputProps {
  mode: 'surah' | 'juz';
  rangeStart: string;
  rangeEnd: string;
  useMultiRange: boolean;
  setRangeStart: (v: string) => void;
  setRangeEnd: (v: string) => void;
  onGo: () => void;
  toggleMulti: () => void;
  onOpenList: () => void;
}

export function RangeInput({
  mode, rangeStart, rangeEnd, useMultiRange,
  setRangeStart, setRangeEnd, onGo, toggleMulti, onOpenList
}: RangeInputProps) {
  
  const placeholderText = mode === 'surah' ? 'Surah' : 'Juz';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGo();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <div className="flex items-center gap-1.5">
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={rangeStart}
            onChange={e => /^[0-9]*$/.test(e.target.value) && setRangeStart(e.target.value)}
            className="border rounded-lg px-2 py-2 w-24 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none text-sm"
            placeholder={placeholderText}
          />
          {useMultiRange && (
            <>
              <span className="text-gray-400 font-bold text-xs">to</span>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={rangeEnd}
                onChange={e => /^[0-9]*$/.test(e.target.value) && setRangeEnd(e.target.value)}
                className="border rounded-lg px-2 py-2 w-24 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none text-sm"
                placeholder={placeholderText}
              />
            </>
          )}
        </div>
        <button type="submit" className="px-6 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-semibold shadow-md hover:brightness-110 active:scale-95 transition-all text-sm">
          Go
        </button>
      </div>

      <div className="flex items-center justify-center gap-6">
        <button type="button" onClick={toggleMulti} className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider hover:underline transition-all">
          {useMultiRange ? 'Single Surah' : 'Range Mode'}
        </button>
        <button type="button" onClick={onOpenList} className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest flex items-center gap-1 hover:text-emerald-600 transition-all">
          <span className="text-sm">📖</span> Surah List
        </button>
      </div>
    </form>
  );
}