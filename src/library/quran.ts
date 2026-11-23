import data from "../assets/quran.json";
import chapters from "../assets/chapters.json";
import { normalizeSearch } from "./model";
export const verses = data.map((v) => ({
  key: v.surah + ":" + v.ayah,
  text: v.text,
  surah: v.surah,
  ayah: v.ayah,
}));
const byKey = new Map(verses.map((v) => [v.key, v]));
export function verseText(key: string) {
  return byKey.get(key)?.text || "";
}
export function verseWords(key: string) {
  return verseText(key)
    .split(/\s+/u)
    .map((word) => word.replace(/[\u06d6-\u06de\u06e9]/gu, ""))
    .filter((word) => /\p{L}/u.test(word));
}
export function reference(key: string) {
  const [s, a] = key.split(":").map(Number);
  return (chapters[s - 1]?.name || "") + " " + a;
}
const searchable = verses.map((v) => ({
  ...v,
  search: normalizeSearch(
    v.text + " " + reference(v.key) + " " + chapters[v.surah - 1]?.arabic,
  ),
}));
export function findVerses(query: string) {
  const q = normalizeSearch(
    query
      .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 1632))
      .replace(/[۰-۹]/g, (c) => String(c.charCodeAt(0) - 1776)),
  );
  if (!q) return [];
  const match = /^(\d+)\s*:\s*(\d+)$/.exec(q);
  return (
    match
      ? searchable.filter(
          (v) => v.key === Number(match[1]) + ":" + Number(match[2]),
        )
      : searchable.filter((v) => v.search.includes(q))
  ).slice(0, 40);
}
