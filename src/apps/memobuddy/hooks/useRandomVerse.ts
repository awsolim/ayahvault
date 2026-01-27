// src/apps/memobuddy/hooks/useRandomVerse.ts

import { useState, useCallback } from 'react';
import quranData from '../../../assets/quran.json'; 
import type { Verse } from '../../../assets/types';

const quran = quranData as Verse[];

export function useRandomVerse() {
  const [randomVerse, setRandomVerse] = useState<Verse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPool, setCurrentPool] = useState<Verse[]>([]);

  const generateRandomVerse = useCallback((mode: string, config: any) => {
    setErrorMessage('');
    let filtered: Verse[] = [];

    try {
      if (mode === 'full') {
        filtered = quran;
      } 
      else if (mode === 'surah' || mode === 'juz') {
        const key = mode as 'surah' | 'juz';
        const start = parseInt(config.start);
        const end = parseInt(config.end);
        const lower = Math.min(start, end);
        const upper = Math.max(start, end);
        filtered = quran.filter(v => v[key] >= lower && v[key] <= upper);
      } 
      else if (mode === 'custom') {
        const { type, items, exact } = config;

        if (type === 'exact') {
          const startVal = exact.startSurah * 1000 + (exact.startAyah || 1);
          const endVal = exact.endSurah * 1000 + (exact.endAyah || 999);
          filtered = quran.filter(v => {
            const currentVal = v.surah * 1000 + v.ayah;
            return currentVal >= startVal && currentVal <= endVal;
          });
        } else {
          filtered = quran.filter(v => {
            const inSelection = items.some((item: any) => 
              item.type === 'surah' ? v.surah === item.val : v.juz === item.val
            );
            return type === 'include' ? inSelection : !inSelection;
          });
        }
      }

      if (filtered.length === 0) {
        setErrorMessage("No verses found.");
        setRandomVerse(null);
        setCurrentPool([]);
      } else {
        setCurrentPool(filtered);
        const idx = Math.floor(Math.random() * filtered.length);
        setRandomVerse(filtered[idx]);
      }
    } catch (err) {
      setErrorMessage("Error picking verse.");
    }
  }, []);

  const navigateToAdjacentVerse = useCallback((offset: number) => {
    if (currentPool.length === 0 || !randomVerse) return;
    
    // FIX: Use unique surah and ayah identifiers instead of v.text
    const currentIndex = currentPool.findIndex(
      v => v.surah === randomVerse.surah && v.ayah === randomVerse.ayah
    );
    
    if (currentIndex === -1) return;

    const nextIndex = (currentIndex + offset + currentPool.length) % currentPool.length;
    setRandomVerse(currentPool[nextIndex]);
  }, [currentPool, randomVerse]);

  return { 
    randomVerse, 
    errorMessage, 
    generateRandomVerse, 
    navigateToAdjacentVerse, 
    setRandomVerse 
  };
}