// src/apps/memobuddy/components/VerseCard.tsx
import { useMemo } from 'react';
import type { Verse } from '../../../assets/types';
import { useInputCapabilities } from '../../../components/hooks/useInputCapabilities';

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
  const { keyboardCapable } = useInputCapabilities();
  const goPrev = useMemo(() => onPrev ?? (() => {}), [onPrev]);
  const goNext = useMemo(() => onNext ?? (() => {}), [onNext]);

  const showBottomButtons = !keyboardCapable;

  const displayedText = useMemo(() => {
    if (!verse) return '';
    if (!partialMode) return verse.text;
    const words = verse.text.split(' ');
    return words.slice(0, partialWordCount).join(' ') + ' ...';
  }, [verse, partialMode, partialWordCount]);

  return (
    /* UI FIX: 
       - lg:max-w-3xl: Makes the card wider on desktop to utilize horizontal space.
       - max-w-md: Keeps it narrow on mobile.
    */
    <div className={['relative w-full transition-all duration-300', 
      showBottomButtons ? 'max-w-md pb-16' : 'max-w-md lg:max-w-3xl pb-0'
    ].join(' ')}>
      
      <div className="
        w-full p-6 lg:p-10 rounded-3xl
        bg-white/95 backdrop-blur-md
        border border-emerald-100/50
        shadow-[0_10px_40px_rgba(0,0,0,0.04)]
        flex flex-col items-center justify-center
        min-h-[280px] text-center
      ">
        {!hasInteracted ? (
          <p className="text-gray-400 italic font-kanit">Enter a range and press Go</p>
        ) : errorMessage ? (
          <p className="text-red-500 font-medium font-kanit">{errorMessage}</p>
        ) : verse ? (
          <div className="w-full">
            {/* Header: Reduced margins to save vertical space */}
            <div className="mb-4 min-h-[2.5rem] flex flex-col items-center justify-center">
              <div className={['transition-opacity duration-300', showInfo ? 'opacity-100' : 'opacity-0'].join(' ')}>
                <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-600 font-kanit">
                  {verse.surahName}
                </h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 font-kanit">
                    SURAH {verse.surah}
                  </span>
                  <span className="w-4 h-[1px] bg-emerald-100" />
                  <span className="text-[10px] font-bold text-slate-400 font-kanit">
                    VERSE {verse.ayah}
                  </span>
                  <span className="w-4 h-[1px] bg-emerald-100" />
                  <span className="text-[10px] font-bold text-slate-400 font-kanit">
                    JUZ {verse.juz}
                  </span>
                </div>
              </div>
            </div>

            {/* TEXT FIX: 
                - Reduced from 6xl to 4xl/5xl.
                - Reduced leading (line-height) from 2.4 to 1.8 to stop excessive scrolling.
            */}
            <p 
              dir="rtl" 
              className={`
                text-4xl sm:text-5xl lg:text-4xl text-slate-900
                font-quran leading-[1.8] lg:leading-[2.0]
                antialiased
                transition-opacity duration-500
                ${!hasInteracted && partialMode ? 'opacity-30' : 'opacity-100'}
              `}
            >
              {displayedText}
            </p>
          </div>
        ) : null}
      </div>

      {showBottomButtons && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="absolute left-3 -bottom-2 px-5 h-12 rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200 shadow-lg flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="text-xl">←</span>
            <span className="text-sm font-bold font-kanit">Prev</span>
          </button>

          <button
            type="button"
            onClick={goNext}
            className="absolute right-3 -bottom-2 px-5 h-12 rounded-2xl bg-white text-slate-700 ring-1 ring-slate-200 shadow-lg flex items-center gap-2 active:scale-95 transition-all"
          >
            <span className="text-sm font-bold font-kanit">Next</span>
            <span className="text-xl">→</span>
          </button>
        </>
      )}
    </div>
  );
}

export default VerseCard;