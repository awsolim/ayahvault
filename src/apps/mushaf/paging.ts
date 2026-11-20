export const PAGE_COUNT = 604;
export function pageOffset(page: number, width: number) { return (PAGE_COUNT - page) * width; }
export function pageAtOffset(offset: number, width: number) {
  if (width <= 0) return 1;
  return Math.max(1, Math.min(PAGE_COUNT, PAGE_COUNT - Math.round(offset / width)));
}
