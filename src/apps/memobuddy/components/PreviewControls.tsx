import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useIsTouchDevice } from "../../../components/hooks/useIsTouchDevice"; // NEW: touch detector

interface PreviewControlsProps {
  partialMode: boolean;
  setPartialMode: Dispatch<SetStateAction<boolean>>;
  partialWordCount: number;
  setPartialWordCount: Dispatch<SetStateAction<number>>;
}

export function PreviewControls({
  partialMode,
  setPartialMode,
  partialWordCount,
}: PreviewControlsProps) {
  const isTouch = useIsTouchDevice(); // NEW: true on tap-first devices

  // If any key is pressed once, we assume a keyboard exists and can show keyboard hints.
  const [keyboardSeen, setKeyboardSeen] = useState(false);
  useEffect(() => {
    const handler = () => setKeyboardSeen(true);
    window.addEventListener("keydown", handler, { once: true });
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const togglePartial = () => setPartialMode(v => !v);

  return (
    // Controls only; label is provided by MemoBuddy in the grid’s first column
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        {/* Show Spacebar hint only on non-touch (or after a key press) */}
        {(!isTouch || keyboardSeen) && (
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
            Spacebar
          </kbd>
        )}

        {/* Full/Partial pill switch with text inside */}
        <button
          type="button"
          role="switch"
          aria-checked={partialMode}
          onClick={togglePartial}
          className={[
            "relative inline-flex select-none h-9 w-28 rounded-full",
            "transition-colors duration-200 ease-out shadow-sm ring-1",
            partialMode ? "bg-emerald-600/90 ring-emerald-700/50" : "bg-slate-300/80 ring-slate-300",
          ].join(" ")}
        >
          {/* static labels under the thumb */}
          <span
            className={[
              "absolute inset-y-0 left-0 w-1/2 flex items-center justify-center text-xs font-semibold",
              partialMode ? "text-white/70" : "text-slate-800",
            ].join(" ")}
            aria-hidden="true"
          >
            Full
          </span>
          <span
            className={[
              "absolute inset-y-0 right-0 w-1/2 flex items-center justify-center text-xs font-semibold",
              partialMode ? "text-slate-100" : "text-slate-700/70",
            ].join(" ")}
            aria-hidden="true"
          >
            Partial
          </span>

          {/* sliding thumb with ACTIVE label */}
          <span
            className={[
              "absolute top-0.5 left-0.5 h-[calc(100%-4px)] w-[calc(50%-4px)]",
              "rounded-full bg-white shadow-md ring-1 ring-black/5",
              "transform transition-transform duration-200 ease-out",
              partialMode ? "translate-x-[calc(100%+4px)]" : "translate-x-0",
              "flex items-center justify-center text-xs font-bold",
              partialMode ? "text-emerald-700" : "text-slate-800",
            ].join(" ")}
          >
            {partialMode ? "Partial" : "Full"}
          </span>
        </button>

        {/* On the same row: Preview Amount & arrow-key hints (only when Partial) */}
        {partialMode && (
          <div className="ml-auto flex items-center gap-2">
            {/* Amount box */}
            <div
              className="px-3 h-9 min-w-[3.5rem] flex items-center justify-center rounded-xl
                         bg-white ring-1 ring-slate-300 font-medium tabular-nums"
              title="Number of words shown in Partial preview"
            >
              {partialWordCount}
            </div>

            {/* Show ↑/↓ keyboard hints only on non-touch (or after a key press) */}
            {(!isTouch || keyboardSeen) && (
              <div className="flex items-center gap-1">
                <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
                  ↑
                </kbd>
                <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
                  ↓
                </kbd>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewControls;
