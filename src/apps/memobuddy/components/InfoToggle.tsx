// src/apps/memobuddy/components/InfoToggle.tsx

interface InfoToggleProps {
  showInfo: boolean;
  setShowInfo: (v: boolean) => void;
}

/** Bottom‐right area: show/hide metadata radios */
export function InfoToggle({ showInfo, setShowInfo }: InfoToggleProps) {
  return (
    <div>
      <p className="font-medium text-sm text-gray-700 mt-6">Verse Information</p>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2 mt-2">
          <input
            type="radio"
            checked={showInfo}
            onChange={() => setShowInfo(true)}
          />
          <span>Show</span>
        </label>
        <label className="flex items-center space-x-2 mt-2">
          <input
            type="radio"
            checked={!showInfo}
            onChange={() => setShowInfo(false)}
          />
          <span>Hide</span>
        </label>
      </div>
    </div>
  );
}
