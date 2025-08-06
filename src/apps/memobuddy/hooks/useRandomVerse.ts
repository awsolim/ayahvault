// src/apps/memobuddy/hooks/useRandomVerse.ts

import { useState } from 'react';
import quran from '../../../assets/quran.json';       // ← original data import
import type { Verse } from '../../../assets/types';               // ← shared Verse interface

/**
 * Encapsulates verse‐generation logic.
 * Returns the current verse, any error message, and functions to generate or navigate.
 */
export function useRandomVerse() {
  const [randomVerse, setRandomVerse] = useState<Verse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /** Pick a random verse in the given numeric range of surah/juz */
  function generateRandomVerse(
    mode: 'surah' | 'juz',
    rangeStart: number,
    rangeEnd: number,
  ) {
    setErrorMessage('');

    const lower = Math.min(rangeStart, rangeEnd);
    const upper = Math.max(rangeStart, rangeEnd);

    // Validate bounds
    if (
      (mode === 'surah' && (lower < 1 || upper > 114)) ||
      (mode === 'juz' && (lower < 1 || upper > 30))
    ) {
      setRandomVerse(null);
      setErrorMessage(`Invalid ${mode === 'surah' ? 'Surah' : 'Juz'} range.`);
      return;
    }

    // Filter and pick
    const filtered = quran.filter((v) =>
      mode === 'surah'
        ? v.surah >= lower && v.surah <= upper
        : v.juz >= lower && v.juz <= upper
    );

    if (filtered.length === 0) {
      setRandomVerse(null);
      setErrorMessage('No verses found for this selection.');
      return;
    }

    const idx = Math.floor(Math.random() * filtered.length);
    setRandomVerse(filtered[idx]);
  }

  /** Move forward/backward in the current filtered list */
  function navigateToAdjacentVerse(
    offset: number,
    mode: 'surah' | 'juz',
    rangeStart: number,
    rangeEnd: number,
  ) {
    if (!randomVerse) return;

    const lower = Math.min(rangeStart, rangeEnd);
    const upper = Math.max(rangeStart, rangeEnd);
    const filtered = quran.filter((v) =>
      mode === 'surah'
        ? v.surah >= lower && v.surah <= upper
        : v.juz >= lower && v.juz <= upper
    );
    const currentIndex = filtered.findIndex(v => v.ayah === randomVerse.ayah);
    const newIndex = currentIndex + offset;
    if (newIndex >= 0 && newIndex < filtered.length) {
      setRandomVerse(filtered[newIndex]);
    }
  }

  return {
    randomVerse,
    errorMessage,
    generateRandomVerse,
    navigateToAdjacentVerse,
  };
}
