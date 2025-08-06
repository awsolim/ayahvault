// src/apps/memobuddy/components/PreviewControls.tsx

interface PreviewControlsProps {
  partialMode: boolean;
  setPartialMode: (v: boolean) => void;
  partialWordCount: number;
  setPartialWordCount: (n: number) => void;
}

/** Bottom‐left area: Full vs Partial toggles + word‐count input + keyboard hint */
export function PreviewControls({
  partialMode, setPartialMode,
  partialWordCount, setPartialWordCount
}: PreviewControlsProps) {
  return (
    <div className="mt-6 space-y-4">
      <div>
        <p className="font-medium text-sm text-gray-700 mb-1 flex items-center gap-2">
          Preview Amount
          <span className="hidden sm:flex items-center space-x-1 text-xs text-gray-500">
            <kbd className="px-1 py-0.5 border bg-gray-100 rounded font-mono">Spacebar</kbd>
            <span>to toggle</span>
          </span>
        </p>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!partialMode}
              onChange={() => setPartialMode(false)}
            />
            <span>Full Preview</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={partialMode}
              onChange={() => setPartialMode(true)}
            />
            <span>Partial Preview</span>
          </label>
        </div>
        {partialMode && (
          <div className="flex items-center space-x-2 mt-2">
            <input
              type="number"
              min={1}
              value={partialWordCount}
              onChange={e => {
                const val = Number(e.target.value);
                if (val >= 1) setPartialWordCount(val);
              }}
              className="border px-2 py-1 rounded w-24"
            />
            <p className="hidden sm:flex text-xs text-gray-500 flex items-center space-x-1 ml-2">
              <kbd className="px-1.5 py-0.5 border rounded bg-gray-100 text-xs font-mono">↑</kbd>
              <kbd className="px-1.5 py-0.5 border rounded bg-gray-100 text-xs font-mono">↓</kbd>
              <span>to change</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
