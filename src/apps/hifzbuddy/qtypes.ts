// Common
export type BaseQ = {
  id: number;
  qtype:
    | "which_surah"
    | "next_verse"
    | "fill_blank"
    | "before_after"
    | "match_2x2"
    | "sort_columns"
    | "spot_diff"
    | "location";
  prompt: any;   // string or object (we parse per type)
  payload: any;
  answer: any;
  tags?: string[];
  difficulty?: number;
};

// Shapes
export type QWhichSurah = BaseQ & {
  qtype: "which_surah";
  prompt: string;
  payload: { options: string[] };
  answer: { index: number };
};

export type QNextVerse = BaseQ & {
  qtype: "next_verse";
  prompt: { verse: string; ref?: string } | string;
  payload: { options: { text: string; ref?: string }[] };
  answer: { index: number };
};

export type QFillBlank = BaseQ & {
  qtype: "fill_blank";
  prompt: { scaffold: string; blankIndex: number } | string;
  payload: { options: string[] };
  answer: { index: number };
};

export type QBeforeAfter = BaseQ & {
  qtype: "before_after";
  prompt: { anchor: string; token: string } | string;
  payload: Record<string, never>;
  answer: { side: "before" | "after" };
};

export type QMatch2x2 = BaseQ & {
  qtype: "match_2x2";
  prompt: string;
  payload: { left: string[]; right: string[] };
  answer: { pairs: [number, number][] };
};

export type QSortColumns = BaseQ & {
  qtype: "sort_columns";
  prompt: string;
  payload: { columns: [string, string]; items: { text: string; col: 0 | 1 }[] };
  answer: Record<string, never>;
};

export type QSpotDiff = BaseQ & {
  qtype: "spot_diff";
  prompt: string;
  payload: { A_tokens: string[]; B_tokens: string[] };
  answer: { diffIndices: number[] }; // indices in A_tokens (and/or B_tokens)
};

export type QLocation = BaseQ & {
  qtype: "location";
  prompt: string;
  payload: { options: { surah: string; ayah?: string }[] };
  answer: { index: number };
};

export type AnyQ =
  | QWhichSurah
  | QNextVerse
  | QFillBlank
  | QBeforeAfter
  | QMatch2x2
  | QSortColumns
  | QSpotDiff
  | QLocation;
