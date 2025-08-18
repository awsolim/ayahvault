// src/apps/memobuddy/components/VerseCard.tsx
import { useMemo } from 'react';
import surahNames from '../../../assets/surahnames';
import type { Verse } from '../../../assets/types';
import { useInputCapabilities } from '../../../components/hooks/useInputCapabilities'; // keyboard vs phone/tablet

interface VerseCardProps {
  verse: Verse | null;
  errorMessage: string;
  hasInteracted: boolean;
  partialMode: boolean;
  partialWordCount: number;
  showInfo: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

export function VerseCard({
  verse, errorMessage, hasInteracted,
  partialMode, partialWordCount, showInfo,
  onPrev, onNext,
}: VerseCardProps) {
  const { keyboardCapable } = useInputCapabilities(); // ✅ desktop-ish (fine pointer/hover) if true
  const goPrev = useMemo(() => onPrev ?? (() => {}), [onPrev]);
  const goNext = useMemo(() => onNext ?? (() => {}), [onNext]);

  // ✅ Show external bottom buttons only on devices without keyboard-like input
  const showBottomButtons = !keyboardCapable;

  return (
    // NEW: wrapper is relative so we can anchor the bottom buttons outside the card
    // NEW: when buttons are shown, reserve space under the card so they don’t collide with the next row
    <div className={['relative max-w-md w-full', showBottomButtons ? 'pb-16' : 'pb-0'].join(' ')}>
      <div className="bg-white rounded-xl shadow-md p-6 w-full text-center min-h-[160px]">
        {!hasInteracted ? (
          <p className="text-gray-500">Select a mode and enter a number to generate a verse.</p>
        ) : errorMessage ? (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        ) : verse ? (
          <>
            {/* Keep a fixed-height area so the card height does not jump when info toggles */}
            <div className="mb-2 min-h-[1.5rem] flex items-center justify-center">
              <p
                className={['text-gray-600 text-sm', showInfo ? '' : 'invisible'].join(' ')}
                aria-hidden={!showInfo}
              >
                Surah {verse.surah}: {surahNames[verse.surah]} &nbsp;&nbsp;
                Ayah: {verse.ayahInSurah} &nbsp; Juz: {verse.juz}
              </p>
            </div>

            {/* Verse text — NO extra side padding anymore (we moved buttons outside) */}
            <p className="text-2xl font-semibold text-gray-800 leading-loose">
              {partialMode
                ? '… ' + verse.text.split(' ').slice(0, partialWordCount).join(' ')
                : verse.text}
            </p>
          </>
        ) : null}
      </div>

      {/* ============== NEW: bottom-attached rectangular buttons (touch/tablet only) ============== */}
      {showBottomButtons && (
        <>
          {/* LEFT (Previous) — slightly outside the card’s bottom-left corner */}
          <button
            type="button"
            aria-label="Previous verse"
            onClick={goPrev}
            className="
              absolute left-3 -bottom-2                       /* stick outside bottom edge */
              px-4 h-10 rounded-xl
              bg-white text-gray-800
              ring-1 ring-slate-300 shadow-sm
              flex items-center gap-2
              active:translate-y-[1px] transition
            "
          >
            <span className="text-lg leading-none">{'\u2190'}</span>
            <span className="text-sm font-medium">Prev</span>
          </button>

          {/* RIGHT (Next) — slightly outside the card’s bottom-right corner */}
          <button
            type="button"
            aria-label="Next verse"
            onClick={goNext}
            className="
              absolute right-3 -bottom-2
              px-4 h-10 rounded-xl
              bg-white text-gray-800
              ring-1 ring-slate-300 shadow-sm
              flex items-center gap-2
              active:translate-y-[1px] transition
            "
          >
            <span className="text-sm font-medium">Next</span>
            <span className="text-lg leading-none">{'\u2192'}</span>
          </button>
        </>
      )}
      {/* =========================== /bottom-attached buttons =========================== */}
    </div>
  );
}

export default VerseCard;
