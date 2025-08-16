// src/apps/memobuddy/components/VerseCard.tsx

import surahNames from '../../../assets/surahnames';
import type { Verse } from '../../../assets/types';

interface VerseCardProps {
  verse: Verse | null;
  errorMessage: string;
  hasInteracted: boolean;
  partialMode: boolean;
  partialWordCount: number;
  showInfo: boolean;
}

/** Renders the central white card with verse / error / prompt */
export function VerseCard({
  verse, errorMessage, hasInteracted,
  partialMode, partialWordCount, showInfo
}: VerseCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center min-h-[160px]">
      {!hasInteracted ? (
        <p className="text-gray-500">Select a mode and enter a number to generate a verse.</p>
      ) : errorMessage ? (
        <p className="text-red-600 font-medium">{errorMessage}</p>
      ) : verse ? (
        <>
          {showInfo && (
            <p className="text-gray-600 text-sm mb-2">
              Surah {verse.surah}: {surahNames[verse.surah]} &nbsp;&nbsp;
              Ayah: {verse.ayahInSurah} &nbsp;
              Juz: {verse.juz}
            </p>
          )}
          <p className="text-2xl font-semibold text-gray-800 leading-loose">
            {partialMode
              ? '… ' + verse.text.split(' ').slice(0, partialWordCount).join(' ')
              : verse.text}
          </p>
        </>
      ) : null}
    </div>
  );
}
