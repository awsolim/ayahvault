import { useCallback } from "react";
import { useSessionState } from "./useSessionState";
import quranData from "../../../assets/quran.json";
import type { Verse } from "../../../assets/types";
import { selectVersePool, verseKey, type MemoConfig } from "../practiceModel";
const quran = quranData as Verse[];
export function poolFor(config: MemoConfig) {
  return selectVersePool(quran, config);
}
export function useRandomVerse() {
  const [randomVerse, setRandomVerse] = useSessionState<Verse | null>(
    "randomVerse",
    null,
  );
  const [errorMessage, setErrorMessage] = useSessionState("errorMessage", "");
  const [currentPool, setCurrentPool] = useSessionState<Verse[]>(
    "currentPool",
    [],
  );
  const generateRandomVerse = useCallback(
    (config: MemoConfig, keepCurrentOnError = false) => {
      try {
        const pool = poolFor(config);
        let index = Math.floor(Math.random() * pool.length);
        if (
          pool.length > 1 &&
          randomVerse &&
          verseKey(pool[index]) === verseKey(randomVerse)
        )
          index = (index + 1) % pool.length;
        const picked = pool[index];
        setErrorMessage("");
        setCurrentPool(pool);
        setRandomVerse(picked);
        return picked;
      } catch (e) {
        setErrorMessage(
          e instanceof Error ? e.message : "Couldn’t generate an ayah.",
        );
        if (!keepCurrentOnError) {
          setRandomVerse(null);
          setCurrentPool([]);
        }
        return null;
      }
    },
    [randomVerse, setErrorMessage, setCurrentPool, setRandomVerse],
  );
  const navigateToAdjacentVerse = useCallback(
    (offset: number) => {
      if (!randomVerse || !currentPool.length) return;
      const index = currentPool.findIndex(
        (v) => verseKey(v) === verseKey(randomVerse),
      );
      if (index >= 0)
        setRandomVerse(
          currentPool[
            (index + offset + currentPool.length) % currentPool.length
          ],
        );
    },
    [randomVerse, currentPool, setRandomVerse],
  );
  return {
    randomVerse,
    errorMessage,
    generateRandomVerse,
    navigateToAdjacentVerse,
    setRandomVerse,
    currentPool,
  };
}
