import type { ReactNode } from "react";
export type PracticeBinding = {
  active: boolean;
  anchor: string;
  questionId: string;
  partialWords: number | null;
  concealHeadings: boolean;
  resumePage?: number;
  recordPage: (page: number) => void;
  visible: (key: string) => boolean;
  renderControls: (jump: (key: string) => void) => ReactNode;
};
