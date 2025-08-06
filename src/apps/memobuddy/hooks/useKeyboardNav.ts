// src/apps/memobuddy/hooks/useKeyboardNav.tsx

import { useEffect } from 'react';
import type { Verse } from '../../../assets/types';

/**
 * Binds Enter/Space/Arrow keys for generation, partial toggle, and navigation.
 * - onGenerate(): called on Enter
 * - onTogglePartial(): called on Space
 * - onNav(offset): called on ArrowLeft/Right
 * - onAdjust(countDelta): called on ArrowUp/Down when in partial mode
 */
export function useKeyboardNav(
  randomVerse: Verse | null,
  partialMode: boolean,
  onGenerate: () => void,
  onTogglePartial: () => void,
  onAdjust: (delta: number) => void,
  onNav: (offset: number) => void
) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onGenerate();
      }
      if (!randomVerse) return;
      if (e.key === ' ') {
        e.preventDefault();
        onTogglePartial();
      } else if (e.key === 'ArrowDown' && partialMode) {
        e.preventDefault();
        onAdjust(-1);
      } else if (e.key === 'ArrowUp' && partialMode) {
        e.preventDefault();
        onAdjust(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNav(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNav(1);
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [randomVerse, partialMode, onGenerate, onTogglePartial, onAdjust, onNav]);
}
