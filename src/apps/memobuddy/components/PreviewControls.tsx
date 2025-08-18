// src/apps/memobuddy/components/PreviewControls.tsx

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useIsTouchDevice } from "../../../components/hooks/useIsTouchDevice"; // ✅ robust touch detection

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
  const isTouch = useIsTouchDevice(); // ✅ true on phones/tablets (and when forced in DevTools)

  // ✅ If any key is pressed, assume hardware keyboard present (e.g., iPad + keyboard)
  const [keyboardSeen, setKeyboardSeen] = useState(false);
  useEffect(() => {
    const handler = () => setKeyboardSeen(true);
    window.addEventListener("keydown", handler, { once: true });
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ✅ keep preview amount sane
  const clamp = (n: number) => Math.max(1, Math.min(999, n));

  const togglePartial = () => setPartialMode(v => !v);   // ✅ toggle Full ↔ Partial
  const dec = () => setPartialWordCount(n => clamp(n - 1)); // ✅ touch minus handler
  const inc = () => setPartialWordCount(n => clamp(n + 1)); // ✅ touch plus handler

  return (
    // This component renders only the controls (the "Preview" label comes from MemoBuddy grid col 1)
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-3">
        {/* ✅ Spacebar hint ONLY when we expect a keyboard */}
        {(!isTouch || keyboardSeen) && (
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
            Spacebar
          </kbd>
        )}

        {/* ✅ Sleek pill switch with text inside: Full ↔ Partial */}
        <button
          type="button"
          role="switch"                  /* a11y: announce as switch */
          aria-checked={partialMode}     /* a11y: state */
          onClick={togglePartial}        /* ✅ toggles preview mode */
          className={[
            "relative inline-flex select-none h-9 w-28 rounded-full",
            "transition-colors duration-200 ease-out shadow-sm ring-1",
            partialMode ? "bg-emerald-600/90 ring-emerald-700/50" : "bg-slate-300/80 ring-slate-300",
          ].join(" ")}
        >
          {/* static labels under thumb */}
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

        {/* ✅ Right side of the row: amount + hints/buttons (only when Partial) */}
        {partialMode && (
          <div className="ml-auto flex items-center gap-2">
            {/* ======= TOUCH MODE: show circular (-) amount (+) ======= */}
            {isTouch && !keyboardSeen && (
              <div className="flex items-center gap-2">
                {/* – button */}
                <button
                  type="button"
                  onClick={dec}                         /* ✅ decrease amount */
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

                {/* amount box */}
                <div
                  className="px-3 h-9 min-w-[3.5rem] flex items-center justify-center rounded-xl
                             bg-white ring-1 ring-slate-300 font-medium tabular-nums"
                  title="Number of words shown in Partial preview"
                >
                  {partialWordCount}
                </div>

                {/* + button */}
                <button
                  type="button"
                  onClick={inc}                         /* ✅ increase amount */
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

            {/* ======= DESKTOP/KEYBOARD MODE: show arrow key <kbd> hints ======= */}
            {(!isTouch || keyboardSeen) && (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PreviewControls;

/*
Summary of changes:
- Detects touch with useIsTouchDevice() (robust + DevTools-friendly).
- Touch (no keyboard seen): shows circular (-) [amount] (+) controls; hides Spacebar/arrow hints.
- Keyboard/mouse (or after any key press on a convertible): shows Spacebar + ↑/↓; hides +/-.
- Clamp & handlers added to keep amount within a safe range.
*/
