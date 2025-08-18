import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Detects input capabilities in a way that keeps 2-in-1 laptops in *desktop mode*.
 * - `keyboardCapable`: true when the environment reports a fine pointer or hover
 *    (mouse/trackpad). We also flip to true if we ever see a mouse/pen pointer.
 * - `touchPrimary`: true when we *don’t* see desktop capability but do see coarse/no-hover/touch.
 *
 * No reliance on keydown (which can fire on soft keyboards).
 */
export function useInputCapabilities() {
  const sawMouseLike = useRef(false);

  const compute = () => {
    const supportsMQ =
      typeof window !== "undefined" && typeof window.matchMedia === "function";
    const mq = (q: string) => (supportsMQ ? window.matchMedia(q).matches : false);

    // Desktop-ish signals
    const anyFine = mq("(any-pointer: fine)");
    const anyHover = mq("(any-hover: hover)");

    // Touch-ish signals
    const anyCoarse = mq("(any-pointer: coarse)");
    const noHover = mq("(hover: none)") || mq("(any-hover: none)");
    const maxTouch =
      (navigator as any)?.maxTouchPoints > 0 ||
      (navigator as any)?.msMaxTouchPoints > 0;
    const onTouch = typeof window !== "undefined" && "ontouchstart" in window;

    const keyboardCapable = sawMouseLike.current || anyFine || anyHover;
    const touchPrimary = !keyboardCapable && (anyCoarse || noHover || maxTouch || onTouch);

    return { keyboardCapable, touchPrimary };
  };

  const [caps, setCaps] = useState(compute);

  useEffect(() => {
    // If we ever see a mouse/pen pointer, lock into keyboard-capable.
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

    // React to MQ changes (covers DevTools toggles etc.)
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

    return () => {
      window.removeEventListener?.("pointermove", onPointer);
      window.removeEventListener?.("pointerdown", onPointer);
      mqls.forEach((mql) => mql.removeEventListener?.("change", onChange));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(() => caps, [caps]);
}
