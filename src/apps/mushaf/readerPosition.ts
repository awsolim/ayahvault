import chapters from "../../assets/chapters.json";
import ayahPages from "../../assets/mushaf-pages.json";
import { parseAyahReference } from "../../lib/ayahReference";
import { PAGE_COUNT } from "./paging";

const chapterLengths = chapters.map(({ verses }) => verses);
export const ayahKeys = ayahPages.flatMap((pages, s) => pages.map((_, a) => `${s + 1}:${a + 1}`));
const ayahIndexes = new Map(ayahKeys.map((key, index) => [key, index]));

export function readAyahReference(value: string) {
  return parseAyahReference(value, chapterLengths);
}

export function ayahIndex(key: string) {
  return ayahIndexes.get(key) ?? -1;
}

export function firstAyahPage(key: string) {
  if (!ayahIndexes.has(key)) return undefined;
  const [surah, ayah] = key.split(":").map(Number);
  return ayahPages[surah - 1][ayah - 1];
}

export function validPage(page: number) {
  return Number.isInteger(page) && page >= 1 && page <= PAGE_COUNT;
}

export function pageCanContainAyah(page: number, key: string) {
  const first = firstAyahPage(key);
  if (!first || !validPage(page)) return false;
  const next = ayahKeys[ayahIndex(key) + 1];
  return page >= first && page <= (firstAyahPage(next) ?? first);
}

export const markerKey = "ayahvault-reading-marker";
const historyKey = "ayahvault-last-page";

export function readDeviceValue(key: string) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}

export function readMarker() {
  const [page, ...parts] = readDeviceValue(markerKey).split(":");
  const ayah = parts.join(":");
  const first = firstAyahPage(ayah);
  if (!first) return null;
  return { ayah, page: pageCanContainAyah(Number(page), ayah) ? Number(page) : first };
}

export function lastReadPage() {
  const page = Number(readDeviceValue(historyKey));
  return validPage(page) ? page : null;
}

export function rememberPage(page: number) {
  try { localStorage.setItem(historyKey, String(page)); } catch { /* Optional history. */ }
}
