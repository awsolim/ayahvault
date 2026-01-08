// src/apps/memobuddy/components/InfoToggle.tsx

import { useEffect } from "react";
import { useInputCapabilities } from "../../../components/hooks/useInputCapabilities";

interface InfoToggleProps {
  showInfo: boolean;
  setShowInfo: (v: boolean | ((prev: boolean) => boolean)) => void;
}

export function InfoToggle({ showInfo, setShowInfo }: InfoToggleProps) {
  const { keyboardCapable } = useInputCapabilities();

  useEffect(() => {
    if (!keyboardCapable) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const ae = document.activeElement as HTMLElement | null;
      const typing = ae && (ae.tagName === "INPUT" || ae.tagName === "SELECT");
      if (typing) return;
      if (e.key === "Shift") {
        setShowInfo((v) => !v);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboardCapable, setShowInfo]);

  return (
    <div className="flex items-center gap-3">
      {/* Keyboard Hint - sits to the left of the switch */}
      {keyboardCapable && (
        <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-500 shadow-sm uppercase">
          Shift
        </kbd>
      )}

      {/* Sliding Switch Toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className={`relative w-24 h-8 rounded-full transition-all duration-300 border shadow-inner ${
          showInfo ? 'bg-emerald-500 border-emerald-600' : 'bg-slate-200 border-slate-300'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-11 h-[26px] bg-white rounded-full shadow-md flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
          showInfo ? 'translate-x-12 text-emerald-600' : 'translate-x-0 text-slate-600'
        }`}>
          {showInfo ? 'SHOW' : 'HIDE'}
        </div>
      </button>
    </div>
  );
}