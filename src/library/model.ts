export const TEXT_VERSION = "ayahvault-uthmani-1";
export type Span = { verse: string; start: number; end: number };
export type Mark = { id: string; label: string; color: string; spans: Span[] };
export type Passage = { verse: string; note: string };
export type Entry = {
  id: string;
  title: string;
  notes: string;
  passages: Passage[];
  marks: Mark[];
  textVersion: string;
  createdAt: string;
  updatedAt: string;
};
export type RecordRow = {
  key: string;
  scope: string;
  id: string;
  entry: Entry;
  revision: number;
  dirty: boolean;
  deleted: boolean;
};
export const palette = ["#d8b34b", "#5592a8", "#a77496", "#668b65", "#b87c52"];
export function newEntry(verse?: string): Entry {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "",
    notes: "",
    passages: verse ? [{ verse, note: "" }] : [],
    marks: [],
    textVersion: TEXT_VERSION,
    createdAt: now,
    updatedAt: now,
  };
}
export function normalizeSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .toLowerCase()
    .trim();
}
export function validateEntry(
  value: unknown,
  counts: number[],
  wordCount?: (verse: string) => number,
): value is Entry {
  if (!value || typeof value !== "object") return false;
  const e = value as Entry;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      e.id,
    ) ||
    typeof e.title !== "string" ||
    e.title.length > 200 ||
    typeof e.notes !== "string" ||
    e.notes.length > 20000 ||
    e.textVersion !== TEXT_VERSION ||
    !Number.isFinite(Date.parse(e.createdAt)) ||
    !Number.isFinite(Date.parse(e.updatedAt))
  )
    return false;
  if (
    !Array.isArray(e.passages) ||
    !e.passages.length ||
    e.passages.length > 100 ||
    !Array.isArray(e.marks) ||
    e.marks.length > 30
  )
    return false;
  const keys = new Set<string>();
  for (const p of e.passages) {
    if (
      !p ||
      typeof p.verse !== "string" ||
      typeof p.note !== "string" ||
      p.note.length > 10000
    )
      return false;
    const [s, a] = p.verse.split(":").map(Number);
    if (
      p.verse !== s + ":" + a ||
      !counts[s - 1] ||
      a < 1 ||
      a > counts[s - 1] ||
      keys.has(p.verse)
    )
      return false;
    keys.add(p.verse);
  }
  const ids = new Set<string>();
  for (const m of e.marks) {
    if (
      !m ||
      typeof m.id !== "string" ||
      ids.has(m.id) ||
      typeof m.label !== "string" ||
      !m.label.trim() ||
      m.label.length > 80 ||
      !/^#[0-9a-f]{6}$/i.test(m.color) ||
      !Array.isArray(m.spans) ||
      m.spans.length > 500
    )
      return false;
    ids.add(m.id);
    for (const s of m.spans)
      if (
        !s ||
        !keys.has(s.verse) ||
        !Number.isInteger(s.start) ||
        !Number.isInteger(s.end) ||
        s.start < 1 ||
        s.end < s.start ||
        s.end > (wordCount ? wordCount(s.verse) : 1000)
      )
        return false;
  }
  return true;
}
export function assignSpan(entry: Entry, markId: string, span: Span): Entry {
  // One annotation per word: reassigning a selection splits existing ranges.
  return {
    ...entry,
    marks: entry.marks.map((mark) => ({
      ...mark,
      spans: mark.spans
        .flatMap((s) => {
          if (
            s.verse !== span.verse ||
            s.end < span.start ||
            s.start > span.end
          )
            return [s];
          return [
            ...(s.start < span.start ? [{ ...s, end: span.start - 1 }] : []),
            ...(s.end > span.end ? [{ ...s, start: span.end + 1 }] : []),
          ];
        })
        .concat(mark.id === markId ? [span] : []),
    })),
  };
}
export function rowKey(scope: string, id: string) {
  return scope + ":" + id;
}
