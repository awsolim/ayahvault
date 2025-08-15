// src/components/ui/Spinner.tsx
import React from "react";
import { useLocation } from "react-router-dom";

type SpinnerProps = {
  size?: number;
  thickness?: number;
  colorClassName?: string; // optional explicit override
  message?: string;
  className?: string;
};

export default function Spinner({
  size = 28,
  thickness = 3,
  colorClassName,
  message,
  className = "",
}: SpinnerProps) {
  const { pathname } = useLocation(); // NEW: get current route

  // NEW: same idea as BackButton — route → theme color
  const themeColorMap: Record<string, string> = {
    "/memobuddy": "text-emerald-600",
    "/triviabuddy": "text-blue-600",
    "/arabuddy": "text-purple-600",
  };

  // NEW: choose the longest matching prefix; fallback is neutral
  const routeColor =
    Object.keys(themeColorMap)
      .filter(prefix => pathname.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0] ?? "";

  const finalColor = colorClassName ?? (routeColor ? themeColorMap[routeColor] : "text-slate-600");

  // NEW: dynamic size/thickness while using Tailwind for color/animation
  const spinnerStyle: React.CSSProperties = { width: size, height: size, borderWidth: thickness };

  return (
    <div role="status" className={`inline-flex items-center gap-3 ${finalColor} ${className}`} aria-live="polite" aria-busy="true">
      <div className="rounded-full animate-spin border-solid border-current border-t-transparent" style={spinnerStyle} aria-hidden="true" />
      {message ? <span className="text-sm font-medium text-slate-700">{message}</span> : <span className="sr-only">Loading…</span>}
    </div>
  );
}
