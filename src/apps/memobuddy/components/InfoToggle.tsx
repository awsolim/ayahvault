import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useInputCapabilities } from "../../../components/hooks/useInputCapabilities"; // keyboard vs phone/tablet

interface InfoToggleProps {
  showInfo: boolean;
  setShowInfo: Dispatch<SetStateAction<boolean>>;
}

export function InfoToggle({ showInfo, setShowInfo }: InfoToggleProps) {
  const { keyboardCapable } = useInputCapabilities(); // ✅ true on desktop/2-in-1 with mouse/trackpad

  // NEW: Toggle Verse Info with Shift key (desktop only)
  useEffect(() => {
    if (!keyboardCapable) return; // ✅ don’t attach on phones/tablets

    const onKeyDown = (e: KeyboardEvent) => {
      // Guard: don’t fire while user is typing in a field/contentEditable
      const ae = document.activeElement as HTMLElement | null;
      const typing =
        ae &&
        (ae.tagName === "INPUT" ||
          ae.tagName === "TEXTAREA" ||
          ae.isContentEditable);
      if (typing) return;

      // Toggle on Shift key
      if (e.key === "Shift") {
        setShowInfo((v) => !v); // ✅ flip show/hide
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboardCapable, setShowInfo]);

  const toggle = () => setShowInfo((v) => !v); // click handler (unchanged)

  return (
    // This component renders only the controls; the "Verse Info" label is in MemoBuddy’s grid col 1
    <div className="w-full">
      <div className="flex items-center gap-3">
        {/* NEW: keyboard hint appears BEFORE the switch on desktop/keyboard mode */}
        {keyboardCapable && (
          <kbd className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-mono">
            Shift
          </kbd>
        )}

        {/* Show/Hide pill switch with text inside */}
        <button
          type="button"
          role="switch"            /* a11y: announce as switch */
          aria-checked={showInfo}
          onClick={toggle}
          className={[
            "relative inline-flex select-none h-9 w-28 rounded-full",
            "transition-colors duration-200 ease-out shadow-sm ring-1",
            showInfo ? "bg-emerald-600/90 ring-emerald-700/50" : "bg-slate-300/80 ring-slate-300",
          ].join(" ")}
        >
          {/* static labels under the thumb */}
          <span
            className={[
              "absolute inset-y-0 left-0 w-1/2 flex items-center justify-center text-xs font-semibold",
              showInfo ? "text-white/70" : "text-slate-800",
            ].join(" ")}
            aria-hidden="true"
          >
            Show
          </span>
          <span
            className={[
              "absolute inset-y-0 right-0 w-1/2 flex items-center justify-center text-xs font-semibold",
              showInfo ? "text-slate-100" : "text-slate-700/70",
            ].join(" ")}
            aria-hidden="true"
          >
            Hide
          </span>

          {/* sliding thumb with ACTIVE label */}
          <span
            className={[
              "absolute top-0.5 left-0.5 h-[calc(100%-4px)] w-[calc(50%-4px)]",
              "rounded-full bg-white shadow-md ring-1 ring-black/5",
              "transform transition-transform duration-200 ease-out",
              showInfo ? "translate-x-[calc(100%+4px)]" : "translate-x-0",
              "flex items-center justify-center text-xs font-bold",
              showInfo ? "text-emerald-700" : "text-slate-800",
            ].join(" ")}
          >
            {showInfo ? "Hide" : "Show"}
          </span>
        </button>
      </div>
    </div>
  );
}

export default InfoToggle;

/*
SUMMARY OF CHANGES:
- Desktop/keyboard mode: adds <kbd>Shift</kbd> hint before the pill and binds Shift to toggle verse info.
- Guarded so typing in inputs/textarea/contentEditable won’t trigger the toggle.
- Touch-only devices: no hint and no key listener (unchanged).
*/
