// src/apps/memobuddy/components/hooks/useIsTouchDevice.ts
// NEW LOCATION: moved under components/hooks
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Returns true when the device is effectively *touch-only*:
 *  - Coarse pointer and no hover (phones/tablets)
 *  - No detected mouse/pen pointer
 * Notes:
 *  - Ignores soft-keyboard keydown (iOS); relies on pointer/hover capabilities.
 *  - Reacts to DevTools "Force touch" and to attaching/detaching a mouse.
 *  - Debug overrides:
 *      • localStorage.forceTouchOnly = "1"
 *      • URL ?touchOnly=1
 */
export function useIsTouchDevice(): boolean {
  const hasMouseRef = useRef(false);

  const compute = () => {
    // Debug override via URL (for quick testing)  // NEW
    try {
      const sp = new URLSearchParams(window.location.search);
      const ov = sp.get("touchOnly");
      if (ov && ov !== "0" && ov !== "false") return true;
    } catch {}

    // Debug override via localStorage               // NEW
    try {
      if (localStorage.getItem("forceTouchOnly") === "1") return true;
    } catch {}

    const mq = (q: string) =>
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia(q).matches;

    const anyFine   = mq("(any-pointer: fine)");
    const anyHover  = mq("(any-hover: hover)");
    const anyCoarse = mq("(any-pointer: coarse)");
    const noHover   = mq("(hover: none)") || mq("(any-hover: none)");

    // If we have an actual mouse/pen detected at runtime, treat as non-touch-only
    const hasMouse = hasMouseRef.current || anyFine || anyHover;
    if (hasMouse) return false;

    // Otherwise, treat as touch-only if coarse and/or no hover, or classic touch signals
    const maxTouch = (navigator as any)?.maxTouchPoints > 0 || (navigator as any)?.msMaxTouchPoints > 0;
    const onTouch  = "ontouchstart" in window;

    return !!(anyCoarse || noHover || maxTouch || onTouch);
  };

  const [isTouchOnly, setIsTouchOnly] = useState<boolean>(() => compute());

  useEffect(() => {
    // Detect a real mouse/pen pointer dynamically (covers iPad + trackpad)   // NEW
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        if (!hasMouseRef.current) {
          hasMouseRef.current = true;
          setIsTouchOnly(compute());
        }
      }
    };
    window.addEventListener?.("pointermove", onPointer, { passive: true });
    window.addEventListener?.("pointerdown", onPointer, { passive: true });

    // React to media query changes (DevTools toggles, etc.)                   // NEW
    const queries = [
      "(any-pointer: fine)",
      "(any-hover: hover)",
      "(any-pointer: coarse)",
      "(hover: none)",
      "(any-hover: none)",
    ];
    const mqls =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? queries.map(q => window.matchMedia(q))
        : [];
    const onChange = () => setIsTouchOnly(compute());
    mqls.forEach(mql => mql.addEventListener?.("change", onChange));

    return () => {
      window.removeEventListener?.("pointermove", onPointer);
      window.removeEventListener?.("pointerdown", onPointer);
      mqls.forEach(mql => mql.removeEventListener?.("change", onChange));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => isTouchOnly, [isTouchOnly]);
}
