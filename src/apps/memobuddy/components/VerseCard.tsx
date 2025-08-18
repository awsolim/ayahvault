import { useEffect, useMemo, useState } from 'react';
import surahNames from '../../../assets/surahnames';
import type { Verse } from '../../../assets/types';
import { useIsTouchDevice } from '../../../components/hooks/useIsTouchDevice'; // NEW: touch detector

interface VerseCardProps {
  verse: Verse | null;
  errorMessage: string;
  hasInteracted: boolean;
  partialMode: boolean;
  partialWordCount: number;
  showInfo: boolean;
  onPrev?: () => void; // optional touch nav
  onNext?: () => void; // optional touch nav
}

/** Renders the central white card with verse / error / prompt */
export function VerseCard({
  verse, errorMessage, hasInteracted,
  partialMode, partialWordCount, showInfo,
  onPrev, onNext,
}: VerseCardProps) {
  const isTouch = useIsTouchDevice(); // NEW: true on tap-first devices
  const [showMobileArrows, setShowMobileArrows] = useState(isTouch);

  // If a key is pressed once (hardware keyboard present), hide arrows for this session
  useEffect(() => {
    if (!isTouch) return;
    const handleKeyDown = () => setShowMobileArrows(false);
    window.addEventListener('keydown', handleKeyDown, { once: true });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTouch]);

  const goPrev = useMemo(() => onPrev ?? (() => {}), [onPrev]);
  const goNext = useMemo(() => onNext ?? (() => {}), [onNext]);

  return (
    <div className="relative bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center min-h-[160px]">
      {!hasInteracted ? (
        <p className="text-gray-500">Select a mode and enter a number to generate a verse.</p>
      ) : errorMessage ? (
        <p className="text-red-600 font-medium">{errorMessage}</p>
      ) : verse ? (
        <>
          {/* Reserve space for verse info so the card height doesn't jump */}
          <div className="mb-2 min-h-[1.5rem] flex items-center justify-center">
            <p
              className={['text-gray-600 text-sm', showInfo ? '' : 'invisible'].join(' ')}
              aria-hidden={!showInfo}
            >
              Surah {verse.surah}: {surahNames[verse.surah]} &nbsp;&nbsp;
              Ayah: {verse.ayahInSurah} &nbsp;
              Juz: {verse.juz}
            </p>
          </div>

          <p className="text-2xl font-semibold text-gray-800 leading-loose">
            {partialMode
              ? '… ' + verse.text.split(' ').slice(0, partialWordCount).join(' ')
              : verse.text}
          </p>

          {/* Circular arrows only on touch devices (and until a keyboard key is pressed) */}
          {showMobileArrows && (
            <>
              <button
                type="button"
                aria-label="Previous verse"
                onClick={goPrev}
                className="
                  absolute left-3 bottom-3
                  h-12 w-12 rounded-full
                  flex items-center justify-center
                  bg-gray-100 hover:bg-gray-200 active:bg-gray-300
                  text-gray-700 shadow-md ring-1 ring-black/10 select-none
                "
              >
                <span className="text-2xl leading-none">{'\u2190'}</span>
              </button>

              <button
                type="button"
                aria-label="Next verse"
                onClick={goNext}
                className="
                  absolute right-3 bottom-3
                  h-12 w-12 rounded-full
                  flex items-center justify-center
                  bg-gray-100 hover:bg-gray-200 active:bg-gray-300
                  text-gray-700 shadow-md ring-1 ring-black/10 select-none
                "
              >
                <span className="text-2xl leading-none">{'\u2192'}</span>
              </button>
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

export default VerseCard;
