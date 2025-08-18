import type { Dispatch, SetStateAction } from "react";

interface InfoToggleProps {
  showInfo: boolean;
  setShowInfo: Dispatch<SetStateAction<boolean>>;
}

export function InfoToggle({ showInfo, setShowInfo }: InfoToggleProps) {
  const toggle = () => setShowInfo(v => !v);

  // This component renders only the Show/Hide pill (no label). It's placed in col 2 of the grid.
  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
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
