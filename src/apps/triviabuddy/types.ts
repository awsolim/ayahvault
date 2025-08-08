// before: Clue.id was a number, which caused the TS error
// after: id is now a string, so randomUUID() is valid

export interface Clue {
  /** Unique identifier for this clue (UUID or DB PK) */
  id: string;

  /** Jeopardy category name */
  category: string;

  /** Point value (100,200,…500) */
  points: number;

  /** The clue (question) text */
  question: string;

  /** The correct response text */
  answer: string;
}
