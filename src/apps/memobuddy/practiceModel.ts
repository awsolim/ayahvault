import type { Verse } from "../../assets/types";
export type MemoMode = "surah" | "juz" | "full" | "custom" | null;
export type CustomConfig = {
  type: "include" | "exclude" | "exact";
  items: { type: "surah" | "juz"; val: number }[];
  exact: {
    startSurah: number;
    startAyah: number;
    endSurah: number;
    endAyah: number;
  };
};
export type MemoConfig = {
  mode: MemoMode;
  rangeStart: string;
  rangeEnd: string;
  useMultiRange: boolean;
  customConfig: CustomConfig;
};
export const defaultCustomConfig: CustomConfig = {
  type: "include",
  items: [],
  exact: { startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 7 },
};
export type MushafVisibility = "all" | "following" | "others";
export const visibilityLabels: Record<MushafVisibility, string> = {
  all: "Show All",
  following: "Hide Following Ayahs",
  others: "Hide All Other Ayahs",
};
export const validVisibility = (value: unknown): value is MushafVisibility =>
  value === "all" || value === "following" || value === "others";
export function verseKey(verse: Verse) {
  return verse.surah + ":" + verse.ayah;
}
export function validMode(value: unknown): value is MemoMode {
  return (
    value === null ||
    value === "surah" ||
    value === "juz" ||
    value === "full" ||
    value === "custom"
  );
}
export type PracticeProgress = {
  entryKey: string;
  questionId: string;
  anchor: string;
  through: string;
  active: boolean;
  showAll: boolean;
  promptRevealed: boolean;
  page?: number;
};
export function startPractice(
  anchor: string,
  entryKey: string,
): PracticeProgress {
  return {
    entryKey,
    questionId: crypto.randomUUID(),
    anchor,
    through: anchor,
    active: true,
    showAll: false,
    promptRevealed: false,
  };
}
export function visibleInPractice(
  key: string,
  progress: PracticeProgress,
  visibility: MushafVisibility,
  index: (key: string) => number,
) {
  if (!progress.active || progress.showAll || visibility === "all") return true;
  const current = index(key),
    through = index(progress.through),
    anchor = index(progress.anchor);
  return (
    current >= 0 &&
    current <= through &&
    (visibility !== "others" || current >= anchor)
  );
}
export function continuationEnd(
  anchor: string,
  pool: Verse[],
  ordered: string[],
) {
  const allowed = new Set(pool.map(verseKey));
  let i = ordered.indexOf(anchor);
  if (i < 0) return anchor;
  while (i + 1 < ordered.length && allowed.has(ordered[i + 1])) i++;
  return ordered[i];
}
export function selectVersePool(quran: Verse[], config: MemoConfig): Verse[] {
  const { mode } = config;
  if (!mode) throw new Error("Choose a generation mode.");
  let pool: Verse[];
  if (mode === "full") pool = quran;
  else if (mode === "surah" || mode === "juz") {
    const start = config.rangeStart,
      end = config.useMultiRange ? config.rangeEnd : start,
      max = mode === "surah" ? 114 : 30;
    if (
      !/^\d+$/.test(start) ||
      !/^\d+$/.test(end) ||
      Number(start) < 1 ||
      Number(end) < 1 ||
      Number(start) > max ||
      Number(end) > max
    )
      throw new Error(
        "Enter a valid " + (mode === "surah" ? "surah" : "juz") + " range.",
      );
    pool = quran.filter(
      (v) =>
        v[mode] >= Math.min(Number(start), Number(end)) &&
        v[mode] <= Math.max(Number(start), Number(end)),
    );
  } else {
    const custom = config.customConfig;
    if (custom.type === "exact") {
      const { startSurah, startAyah, endSurah, endAyah } = custom.exact;
      if (
        !quran.some((v) => v.surah === startSurah && v.ayah === startAyah) ||
        !quran.some((v) => v.surah === endSurah && v.ayah === endAyah)
      )
        throw new Error("Enter valid start and end ayahs.");
      const start = startSurah * 1000 + startAyah,
        end = endSurah * 1000 + endAyah;
      pool = quran.filter(
        (v) =>
          v.surah * 1000 + v.ayah >= start && v.surah * 1000 + v.ayah <= end,
      );
    } else
      pool = quran.filter(
        (v) =>
          custom.items.some((item) => v[item.type] === item.val) ===
          (custom.type === "include"),
      );
  }
  if (!pool.length) throw new Error("No ayahs match this range.");
  return pool;
}
