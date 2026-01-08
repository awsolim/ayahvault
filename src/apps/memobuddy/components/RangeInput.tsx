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
  
  const placeholderText = mode === 'surah' ? 'No.' : 'Juz';

  return (
    <form onSubmit={(e) => { e.preventDefault(); onGo(); }} className="flex flex-col items-center w-full">
      <div className="flex items-center justify-center gap-2 mb-4 w-full">
        <div className="flex items-center gap-1">
          <input
            type="text" inputMode="numeric"
            value={rangeStart}
            onChange={e => /^[0-9]*$/.test(e.target.value) && setRangeStart(e.target.value)}
            className="border rounded-lg px-2 py-2 w-16 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none text-sm"
            placeholder={placeholderText}
          />
          {useMultiRange && (
            <>
              <span className="text-gray-400 font-bold text-[10px]">to</span>
              <input
                type="text" inputMode="numeric"
                value={rangeEnd}
                onChange={e => /^[0-9]*$/.test(e.target.value) && setRangeEnd(e.target.value)}
                className="border rounded-lg px-2 py-2 w-16 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300 outline-none text-sm"
                placeholder={placeholderText}
              />
            </>
          )}
        </div>
        <button type="submit" className="px-5 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-bold shadow-md text-sm whitespace-nowrap">
          Go
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button type="button" onClick={toggleMulti} className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight hover:underline">
          {useMultiRange ? 'Single Mode' : 'Range Mode'}
        </button>
        <button type="button" onClick={onOpenList} className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-tight flex items-center gap-1">
          📖 Surah List
        </button>
      </div>
    </form>
  );
}