import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Robustly detect input capabilities:
 * - Phones/tablets (touch-first) → treated as "touchPrimary".
 * - Laptops/desktops (keyboard + mouse/trackpad) → treated as "keyboardCapable".
 *
 * Rules:
 *   1. If we ever detect a real mouse/pen event → keyboardCapable = true.
 *   2. If the device has *no* touch capability but reports fine pointer/hover → desktop.
 *   3. If the device reports touch capability → favor "touchPrimary" even if it also says fine/hover.
 *   4. Optionally, wide screens (> 1024px) bias towards desktop if ambiguous.
 */
export function useInputCapabilities() {
  const sawMouseLike = useRef(false);

  const compute = () => {
    const supportsMQ =
      typeof window !== "undefined" && typeof window.matchMedia === "function";
    const mq = (q: string) => (supportsMQ ? window.matchMedia(q).matches : false);

    // Pointer/hover signals
    const anyFine = mq("(any-pointer: fine)");
    const anyHover = mq("(any-hover: hover)");
    const anyCoarse = mq("(any-pointer: coarse)");
    const noHover = mq("(hover: none)") || mq("(any-hover: none)");

    // Touch capability checks
    const maxTouch =
      (navigator as any)?.maxTouchPoints > 0 ||
      (navigator as any)?.msMaxTouchPoints > 0;
    const onTouch =
      typeof window !== "undefined" && "ontouchstart" in window;

    // Heuristic: wide viewport is usually desktop
    const isWide = typeof window !== "undefined" && window.innerWidth > 1024;

    // If we've ever seen a mouse/pen, lock to desktop
    if (sawMouseLike.current) {
      return { keyboardCapable: true, touchPrimary: false };
    }

    // --- Decide keyboard vs touch ---
    // Case 1: device clearly has no touch → desktop
    if (!maxTouch && !onTouch && (anyFine || anyHover)) {
      return { keyboardCapable: true, touchPrimary: false };
    }

    // Case 2: device clearly has touch capability → treat as touch,
    // even if it claims fine/hover (covers phones & tablets)
    if (maxTouch || onTouch || anyCoarse || noHover) {
      return { keyboardCapable: false, touchPrimary: true };
    }

    // Case 3: ambiguous → use viewport width as tiebreaker
    if (isWide && (anyFine || anyHover)) {
      return { keyboardCapable: true, touchPrimary: false };
    }

    // Default fallback: assume touch
    return { keyboardCapable: false, touchPrimary: true };
  };

  const [caps, setCaps] = useState(compute);

  useEffect(() => {
    // Promote to keyboardCapable permanently if we ever see a mouse/pen pointer
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || e.pointerType === "pen") {
        if (!sawMouseLike.current) {
          sawMouseLike.current = true;
          setCaps(compute());
        }
      }
    };
    window.addEventListener?.("pointermove", onPointer, { passive: true });
    window.addEventListener?.("pointerdown", onPointer, { passive: true });

    // React to media query changes (covers orientation/devtools toggles)
    const queries = [
      "(any-pointer: fine)",
      "(any-hover: hover)",
      "(any-pointer: coarse)",
      "(hover: none)",
      "(any-hover: none)",
    ];
    const mqls =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? queries.map((q) => window.matchMedia(q))
        : [];
    const onChange = () => setCaps(compute());
    mqls.forEach((mql) => mql.addEventListener?.("change", onChange));

    // React to resize (viewport width heuristic)
    const onResize = () => setCaps(compute());
    window.addEventListener?.("resize", onResize);

    return () => {
      window.removeEventListener?.("pointermove", onPointer);
      window.removeEventListener?.("pointerdown", onPointer);
      window.removeEventListener?.("resize", onResize);
      mqls.forEach((mql) => mql.removeEventListener?.("change", onChange));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => caps, [caps]);
}

export default useInputCapabilities;
