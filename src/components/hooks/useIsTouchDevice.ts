import { useEffect, useMemo, useState } from "react";

/**
 * Robust touch detection that works on real devices AND in DevTools.
 * - Checks multiple signals: maxTouchPoints, ontouchstart, pointer/hover media queries.
 * - Reacts to environment changes (e.g., DevTools toggles) via matchMedia listeners.
 * - Supports a debug override with `localStorage.forceTouch = "1"` or URL `?touch=1`.
 */
export function useIsTouchDevice(): boolean {
  const compute = () => {
    // Debug override via URL: ?touch=1 or ?touch=true (only for your testing)
    try {
      if (typeof window !== "undefined") {
        const urlHasTouch =
          new URLSearchParams(window.location.search).get("touch");
        if (urlHasTouch && urlHasTouch !== "0" && urlHasTouch !== "false") {
          return true;
        }
      }
    } catch {}

    // Debug override via localStorage: localStorage.forceTouch = "1"
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem("forceTouch") === "1") {
        return true;
      }
    } catch {}

    // 1) Navigator signals
    const hasMaxTouch =
      typeof navigator !== "undefined" &&
      (navigator as any).maxTouchPoints > 0;

    const hasMsMaxTouch =
      typeof navigator !== "undefined" &&
      (navigator as any).msMaxTouchPoints > 0;

    // 2) Classic event feature detection
    const hasOntouch =
      typeof window !== "undefined" && "ontouchstart" in window;

    // 3) Pointer & hover MQs – DevTools “Force enabled” typically satisfies these
    const mq = (q: string) =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(q).matches;

    const pointerCoarse = mq("(pointer: coarse)") || mq("(any-pointer: coarse)");
    const hoverNone = mq("(hover: none)") || mq("(any-hover: none)");

    return !!(hasMaxTouch || hasMsMaxTouch || hasOntouch || pointerCoarse || hoverNone);
  };

  const [isTouch, setIsTouch] = useState<boolean>(() => compute());

  useEffect(() => {
    // Update on environment changes (e.g., DevTools toggles)
    const mqs = [
      "(pointer: coarse)",
      "(any-pointer: coarse)",
      "(hover: none)",
      "(any-hover: none)",
    ]
      .map(q =>
        typeof window !== "undefined" && typeof window.matchMedia === "function"
          ? window.matchMedia(q)
          : null
      )
      .filter(Boolean) as MediaQueryList[];

    const onChange = () => setIsTouch(compute());
    mqs.forEach(mql => mql.addEventListener?.("change", onChange));

    // If a real touch is detected at runtime, lock it in
    const onFirstTouch = () => setIsTouch(true);
    window.addEventListener?.("touchstart", onFirstTouch, { once: true });

    return () => {
      mqs.forEach(mql => mql.removeEventListener?.("change", onChange));
      window.removeEventListener?.("touchstart", onFirstTouch);
    };
  }, []);

  // Memoize to keep referential stability for consumers
  return useMemo(() => isTouch, [isTouch]);
}
