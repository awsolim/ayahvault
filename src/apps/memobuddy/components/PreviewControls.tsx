import type { Dispatch, SetStateAction } from "react";
import { useInputCapabilities } from "../../../components/hooks/useInputCapabilities"; // <-- NEW PATH

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
  setPartialWordCount,
}: PreviewControlsProps) {
  const { keyboardCapable } = useInputCapabilities(); // ✅ desktop-ish if true

  const clamp = (n: number) => Math.max(1, Math.min(999, n)); // keep it sane
  const togglePartial = () => setPartialMode((v) => !v);
  const dec = () => setPartialWordCount((n) => clamp(n - 1));
  const inc = () => setPartialWordCount((n) => clamp(n + 1));

  return (
    // Controls only; label is rendered by MemoBuddy in grid column 1
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        {/* Spacebar hint only when we expect a keyboard */}
        {keyboardCapable && (
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
            Spacebar
          </kbd>
        )}

        {/* Sleek Full/Partial pill */}
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

          {/* Thumb carrying the active label */}
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

        {/* Right side of row: amount controls (only in Partial) */}
        {partialMode && (
          <div className="ml-auto flex items-center gap-2">
            {keyboardCapable ? (
              // Desktop: show arrow-key <kbd> badges
              <>
                <div
                  className="px-3 h-9 min-w-[3.5rem] flex items-center justify-center rounded-xl
                             bg-white ring-1 ring-slate-300 font-medium tabular-nums"
                  title="Number of words shown in Partial preview"
                >
                  {partialWordCount}
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
                    ↑
                  </kbd>
                  <kbd className="px-2 py-1 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
                    ↓
                  </kbd>
                </div>
              </>
            ) : (
              // Mobile/tablet: show circular (-) amount (+)
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={dec}
                  aria-label="Decrease preview amount"
                  className="
                    h-9 w-9 rounded-full
                    bg-white ring-1 ring-slate-300 text-slate-700
                    flex items-center justify-center
                    shadow-sm active:translate-y-[1px] transition
                  "
                >
                  –
                </button>

                <div
                  className="px-3 h-9 min-w-[3.5rem] flex items-center justify-center rounded-xl
                             bg-white ring-1 ring-slate-300 font-medium tabular-nums"
                  title="Number of words shown in Partial preview"
                >
                  {partialWordCount}
                </div>

                <button
                  type="button"
                  onClick={inc}
                  aria-label="Increase preview amount"
                  className="
                    h-9 w-9 rounded-full
                    bg-white ring-1 ring-slate-300 text-slate-700
                    flex items-center justify-center
                    shadow-sm active:translate-y-[1px] transition
                  "
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewControls;

/*
CHANGE SUMMARY (PreviewControls):
- Now branches on `keyboardCapable`:
  • true  → shows Spacebar + ↑/↓ and hides ± buttons.
  • false → shows circular (−) [amount] (+) and hides keyboard hints.
- Keeps Full/Partial pill exactly as before.
*/
