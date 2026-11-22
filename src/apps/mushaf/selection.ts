export type AyahBox = { key: string; left: number; right: number; top: number; bottom: number };
/** Convert a viewport point into an object-fit:contain image's native pixels. */
export function imagePoint(x: number, y: number, bounds: { left: number; top: number; width: number; height: number }, width: number, height: number) {
 const scale = Math.min(bounds.width / width, bounds.height / height);
 return {
  x: (x - bounds.left - (bounds.width - width * scale) / 2) / scale,
  y: (y - bounds.top - (bounds.height - height * scale) / 2) / scale,
 };
}
export function nearestAyah(x: number, y: number, boxes: AyahBox[]): string | null {
 let closest: string | null = null, best = Infinity;
 for (const box of boxes) {
  const dx = Math.max(box.left - x, 0, x - box.right);
  const dy = Math.max(box.top - y, 0, y - box.bottom);
  const distance = dx * dx + dy * dy;
  if (distance < best) { best = distance; closest = box.key; }
 }
 return closest;
}
