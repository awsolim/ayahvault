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
}

export function RangeInput({
  mode, rangeStart, rangeEnd, useMultiRange,
  setRangeStart, setRangeEnd, onGo, toggleMulti
}: RangeInputProps) {
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGo();
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="text" inputMode="numeric" pattern="[0-9]*"
        value={rangeStart}
        onChange={e => /^[0-9]*$/.test(e.target.value) && setRangeStart(e.target.value)}
        className="border rounded px-2 py-2 w-16 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300"
        placeholder={mode}
      />
      
      {useMultiRange && (
        <>
          <span className="text-gray-500">to</span>
          <input
            type="text" inputMode="numeric" pattern="[0-9]*"
            value={rangeEnd}
            onChange={e => /^[0-9]*$/.test(e.target.value) && setRangeEnd(e.target.value)}
            className="border rounded px-2 py-2 w-16 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300"
            placeholder={mode}
          />
        </>
      )}

      <button
        type="submit"
        className="px-3 py-2 rounded-md text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-semibold shadow hover:brightness-110 hover:scale-105 transition-all duration-300"
      >
        Go
      </button>

      <button
        type="button"
        onClick={toggleMulti}
        className="text-xs text-emerald-600 font-bold hover:underline ml-auto"
      >
        {useMultiRange ? 'Switch to single' : 'Select range'}
      </button>
    </form>
  );
}