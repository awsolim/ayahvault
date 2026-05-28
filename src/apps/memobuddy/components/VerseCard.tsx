// src/apps/memobuddy/components/VerseCard.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { Verse } from '../../../assets/types';
import { useInputCapabilities } from '../../../components/hooks/useInputCapabilities';

type PreviewMode = 'text' | 'audio';
type BackFaceMode = 'translation' | 'tafsir';
type TafsirLanguage = 'ar' | 'en';
type LoadStatus = 'idle' | 'loading' | 'error';

interface VerseCardProps {
  verse: Verse | null;
  errorMessage: string;
  hasInteracted: boolean;
  previewMode: PreviewMode;
  partialMode: boolean;
  partialWordCount: number;
  audioPartialSeconds: number;
  audioPlayRequest: number;
  showInfo: boolean;
  onPrev?: () => void;
  onNext?: () => void;
}

function getMinshawiMurattalUrl(verse: Verse) {
  const surah = String(verse.surah).padStart(3, '0');
  const ayah = String(verse.ayah).padStart(3, '0');
  return `https://everyayah.com/data/Minshawy_Murattal_128kbps/${surah}${ayah}.mp3`;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

const jalalaynMapPromises: Partial<Record<TafsirLanguage, Promise<Map<string, string>>>> = {};

function parseJalalaynText(raw: string) {
  return new Map(
    raw
      .split(/\r?\n/)
      .map((line) => {
        const [surah, ayah, ...textParts] = line.replace(/^\uFEFF/, '').split('|');
        return [`${surah}:${ayah}`, textParts.join('|').trim()] as const;
      })
      .filter(([, text]) => text.length > 0)
  );
}

function loadJalalaynMap(language: TafsirLanguage) {
  const path = language === 'ar' ? '/data/jalalayn-ar.txt' : '/data/jalalayn-en.txt';

  jalalaynMapPromises[language] ??= fetch(path)
    .then((response) => {
      if (!response.ok) throw new Error('jalalayn tafsir unavailable');
      return response.text();
    })
    .then(parseJalalaynText);

  return jalalaynMapPromises[language];
}

function renderBoldedAyahQuotes(text: string) {
  return text.split(/(﴿[^﴾]+﴾|«[^»]+»|\([^()]+\))/g).map((part, index) => {
    const isQuote =
      (part.startsWith('﴿') && part.endsWith('﴾')) ||
      (part.startsWith('«') && part.endsWith('»')) ||
      (part.startsWith('(') && part.endsWith(')'));

    return isQuote ? (
      <strong key={index} className="font-extrabold text-slate-950">
        {part}
      </strong>
    ) : (
      <span key={index}>{part}</span>
    );
  });
}

function AudioVersePreview({
  verse,
  partialMode,
  audioPartialSeconds,
  audioPlayRequest,
  showInfo,
}: {
  verse: Verse;
  partialMode: boolean;
  audioPartialSeconds: number;
  audioPlayRequest: number;
  showInfo: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimerRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioError, setAudioError] = useState('');

  const audioUrl = useMemo(() => getMinshawiMurattalUrl(verse), [verse]);
  const targetDuration = partialMode ? audioPartialSeconds : duration;
  const progressMax = targetDuration > 0 ? targetDuration : 1;
  const progress = Math.min(currentTime, progressMax);

  const clearStopTimer = () => {
    if (stopTimerRef.current) {
      window.clearTimeout(stopTimerRef.current);
      stopTimerRef.current = null;
    }
  };

  const stopPlayback = () => {
    clearStopTimer();
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const playFromStart = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    clearStopTimer();
    setAudioError('');
    audio.currentTime = 0;
    setCurrentTime(0);

    try {
      await audio.play();
      setIsPlaying(true);
      if (partialMode) {
        stopTimerRef.current = window.setTimeout(() => {
          audio.pause();
          setIsPlaying(false);
        }, audioPartialSeconds * 1000);
      }
    } catch {
      setAudioError('Tap play again if your browser blocked audio.');
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    stopPlayback();
    setCurrentTime(0);
    setDuration(0);
    setAudioError('');
    return stopPlayback;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, partialMode, audioPartialSeconds]);

  useEffect(() => {
    if (audioPlayRequest <= 0) return;
    void playFromStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioPlayRequest]);

  return (
    <div className="w-full flex flex-col items-center gap-5">
      <audio
        ref={audioRef}
        src={audioUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          clearStopTimer();
          setIsPlaying(false);
        }}
        onError={() => {
          clearStopTimer();
          setIsPlaying(false);
          setAudioError('Audio unavailable for this ayah.');
        }}
      />

      <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
        <Volume2 size={42} strokeWidth={1.7} />
      </div>

      <div className="text-center">
        <p className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400">
          Minshawi Murattal
        </p>
        <p className="mt-1 text-sm font-semibold text-slate-700">
          {partialMode ? `First ${audioPartialSeconds} seconds` : 'Full ayah'}
        </p>
      </div>

      <div className={['w-full max-w-sm transition-all duration-300', showInfo ? 'opacity-100' : 'opacity-0'].join(' ')}>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          {showInfo && (
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-[width] duration-150"
              style={{ width: `${Math.min(100, (progress / progressMax) * 100)}%` }}
            />
          )}
        </div>
        {showInfo && (
          <div className="mt-2 flex justify-between text-[10px] font-bold text-slate-400 tabular-nums">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(progressMax)}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={playFromStart}
          className="w-14 h-14 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 flex items-center justify-center active:scale-95 transition-all hover:bg-emerald-500"
          aria-label={isPlaying ? 'Restart audio' : 'Play audio'}
        >
          {isPlaying ? <RotateCcw size={22} /> : <Play size={24} className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={stopPlayback}
          className="w-11 h-11 rounded-full bg-white text-slate-600 border border-slate-200 shadow-sm flex items-center justify-center active:scale-95 transition-all disabled:opacity-40"
          aria-label="Pause audio"
          disabled={!isPlaying}
        >
          <Pause size={18} />
        </button>
      </div>

      {audioError && (
        <p className="text-xs font-medium text-red-500">{audioError}</p>
      )}
    </div>
  );
}

export function VerseCard({
  verse, errorMessage, hasInteracted,
  previewMode, partialMode, partialWordCount, audioPartialSeconds, audioPlayRequest, showInfo,
  onPrev, onNext,
}: VerseCardProps) {
  const { keyboardCapable } = useInputCapabilities();
  const goPrev = useMemo(() => onPrev ?? (() => {}), [onPrev]);
  const goNext = useMemo(() => onNext ?? (() => {}), [onNext]);
  const pressTimerRef = useRef<number | null>(null);
  const lastPointerTypeRef = useRef<string>('');
  const translationCacheRef = useRef<Map<string, string>>(new Map());
  const tafsirCacheRef = useRef<Map<string, string>>(new Map());
  const [showTranslation, setShowTranslation] = useState(false);
  const [pendingTranslationFlip, setPendingTranslationFlip] = useState(false);
  const [translation, setTranslation] = useState('');
  const [translationStatus, setTranslationStatus] = useState<LoadStatus>('idle');
  const [backFaceMode, setBackFaceMode] = useState<BackFaceMode>('translation');
  const [tafsirLanguage, setTafsirLanguage] = useState<TafsirLanguage>('ar');
  const [tafsir, setTafsir] = useState('');
  const [tafsirStatus, setTafsirStatus] = useState<LoadStatus>('idle');

  const showBottomButtons = !keyboardCapable;

  const displayedText = useMemo(() => {
    if (!verse) return '';
    if (!partialMode) return verse.text;
    const words = verse.text.split(' ');
    return words.slice(0, partialWordCount).join(' ') + ' ...';
  }, [verse, partialMode, partialWordCount]);

  const verseKey = verse ? `${verse.surah}:${verse.ayah}` : '';
  const isTextBackFace = previewMode === 'text' && showTranslation;
  const showHeaderInfo = showInfo && (previewMode === 'audio' || !showTranslation);

  const clearPressTimer = () => {
    if (pressTimerRef.current) {
      window.clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const toggleTranslation = () => {
    if (!verse || previewMode !== 'text') return;
    if (showTranslation) {
      setShowTranslation(false);
      setPendingTranslationFlip(false);
      return;
    }

    const cached = translationCacheRef.current.get(verseKey);
    if (cached) {
      setTranslation(cached);
      setTranslationStatus('idle');
      setShowTranslation(true);
      return;
    }

    setPendingTranslationFlip(true);
  };

  useEffect(() => {
    setShowTranslation(false);
    setPendingTranslationFlip(false);
    setBackFaceMode('translation');
    setTafsirLanguage('ar');
    setTranslation('');
    setTranslationStatus('idle');
    setTafsir('');
    setTafsirStatus('idle');
    clearPressTimer();
  }, [verseKey, previewMode]);

  useEffect(() => {
    if (!verse || !pendingTranslationFlip) return;
    const cached = translationCacheRef.current.get(verseKey);
    if (cached) {
      setTranslation(cached);
      setTranslationStatus('idle');
      setShowTranslation(true);
      setPendingTranslationFlip(false);
      return;
    }

    let cancelled = false;
    setTranslation('');
    setTranslationStatus('loading');

    fetch(`https://api.alquran.cloud/v1/ayah/${verse.surah}:${verse.ayah}/en.sahih`)
      .then((res) => {
        if (!res.ok) throw new Error('translation unavailable');
        return res.json();
      })
      .then((payload) => {
        const text = payload?.data?.text;
        if (typeof text !== 'string' || !text.trim()) {
          throw new Error('translation unavailable');
        }
        if (cancelled) return;
        translationCacheRef.current.set(verseKey, text);
        setTranslation(text);
        setTranslationStatus('idle');
        setShowTranslation(true);
        setPendingTranslationFlip(false);
      })
      .catch(() => {
        if (cancelled) return;
        setTranslationStatus('error');
        setShowTranslation(true);
        setPendingTranslationFlip(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pendingTranslationFlip, verse, verseKey]);

  const showTafsir = (language: TafsirLanguage = tafsirLanguage) => {
    if (!verse) return;
    const cacheKey = `${language}:${verseKey}`;
    const cached = tafsirCacheRef.current.get(cacheKey);
    setTafsirLanguage(language);
    setBackFaceMode('tafsir');

    if (cached) {
      setTafsir(cached);
      setTafsirStatus('idle');
      return;
    }

    setTafsir('');
    setTafsirStatus('loading');

    loadJalalaynMap(language)
      .then((jalalaynByVerseKey) => {
        const text = jalalaynByVerseKey.get(verseKey);
        if (!text) {
          setTafsirStatus('error');
          return;
        }

        tafsirCacheRef.current.set(cacheKey, text);
        setTafsir(text);
        setTafsirStatus('idle');
      })
      .catch(() => {
        setTafsirStatus('error');
      });
  };

  return (
    /* UI FIX: 
       - lg:max-w-3xl: Makes the card wider on desktop to utilize horizontal space.
       - max-w-md: Keeps it narrow on mobile.
    */
    <div className={['relative w-full transition-all duration-300', 
      showBottomButtons ? 'max-w-md pb-16' : 'max-w-md lg:max-w-3xl pb-0'
    ].join(' ')}>
      
      <div className={[
        'w-full rounded-3xl',
        'bg-white/95 backdrop-blur-md',
        'border border-emerald-100/50',
        'shadow-[0_10px_40px_rgba(0,0,0,0.04)]',
        'flex flex-col items-center',
        'text-center select-none',
        isTextBackFace
          ? 'justify-start p-5 sm:p-6 lg:p-8 min-h-[340px] lg:min-h-[360px]'
          : 'justify-center p-6 lg:p-10 min-h-[280px]',
      ].join(' ')}
        onPointerDown={(e) => {
          lastPointerTypeRef.current = e.pointerType;
          if (previewMode !== 'text' || e.pointerType !== 'touch') return;
          clearPressTimer();
          pressTimerRef.current = window.setTimeout(toggleTranslation, 1000);
        }}
        onPointerUp={clearPressTimer}
        onPointerCancel={clearPressTimer}
        onPointerLeave={clearPressTimer}
        onClick={() => {
          if (previewMode !== 'text' || lastPointerTypeRef.current === 'touch') return;
          toggleTranslation();
        }}
      >
        {!hasInteracted ? (
          <p className="text-gray-400 italic font-kanit">Enter a range and press Go</p>
        ) : errorMessage ? (
          <p className="text-red-500 font-medium font-kanit">{errorMessage}</p>
        ) : verse ? (
          <div className="w-full">
            {/* Header: Reduced margins to save vertical space */}
            {!isTextBackFace && (
              <div className="mb-4 min-h-[2.5rem] flex flex-col items-center justify-center">
                <div className={['transition-opacity duration-300', showHeaderInfo ? 'opacity-100' : 'opacity-0'].join(' ')}>
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
            )}

            {previewMode === 'audio' ? (
              <AudioVersePreview
                verse={verse}
                partialMode={partialMode}
                audioPartialSeconds={audioPartialSeconds}
                audioPlayRequest={audioPlayRequest}
                showInfo={showInfo}
              />
            ) : (
              <div
                className={['relative w-full', isTextBackFace ? 'min-h-[300px] lg:min-h-[310px]' : 'min-h-[190px]'].join(' ')}
                style={{ perspective: '1200px' }}
              >
                <div
                  className={['relative w-full transition-transform duration-700 ease-in-out', isTextBackFace ? 'min-h-[300px] lg:min-h-[310px]' : 'min-h-[190px]'].join(' ')}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: showTranslation ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    <p 
                      dir="rtl" 
                      className={`
                        text-4xl sm:text-5xl lg:text-4xl text-slate-900
                        font-quran leading-[1.8] lg:leading-[2.0]
                        antialiased
                        transition-opacity duration-500
                        ${pendingTranslationFlip ? 'opacity-45' : 'opacity-100'}
                      `}
                    >
                      {displayedText}
                    </p>
                  </div>

                  <div
                    className="absolute inset-0 flex flex-col items-center justify-start gap-3 px-1 pt-1"
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                  >
                    {backFaceMode === 'tafsir' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          showTafsir(tafsirLanguage === 'ar' ? 'en' : 'ar');
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner"
                        aria-label={`Switch tafsir to ${tafsirLanguage === 'ar' ? 'English' : 'Arabic'}`}
                      >
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${tafsirLanguage === 'ar' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                          Arabic
                        </span>
                        <span className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${tafsirLanguage === 'en' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
                          English
                        </span>
                      </button>
                    )}
                    <p className="text-xs font-bold tracking-[0.18em] uppercase text-slate-400">
                      {backFaceMode === 'translation'
                        ? 'Sahih International'
                        : `Tafsir al-Jalalayn (${tafsirLanguage === 'ar' ? 'Arabic' : 'English'})`}
                    </p>
                    {backFaceMode === 'translation' ? (
                      <>
                        {translationStatus === 'error' ? (
                          <p className="text-sm font-medium text-red-500">Translation unavailable.</p>
                        ) : (
                          <p className="text-xl sm:text-2xl leading-relaxed text-slate-800 font-kanit">
                            {translation}
                          </p>
                        )}
                        {translationStatus !== 'error' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              showTafsir();
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                            className="mt-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-700 shadow-sm active:scale-95 transition-all"
                          >
                            Show Tafsir
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <div
                          dir={tafsirLanguage === 'ar' ? 'rtl' : 'ltr'}
                          className={`w-full max-h-[210px] sm:max-h-[230px] lg:max-h-[240px] overflow-y-auto px-1 text-slate-800 font-kanit ${
                            tafsirLanguage === 'ar'
                              ? 'text-xl sm:text-2xl leading-loose'
                              : 'text-base sm:text-lg leading-relaxed'
                          }`}
                        >
                          {tafsirStatus === 'loading' ? (
                            <span className="text-sm font-medium text-slate-400">
                              {tafsirLanguage === 'ar' ? 'جاري تحميل التفسير...' : 'Loading tafsir...'}
                            </span>
                          ) : tafsirStatus === 'error' ? (
                            <span className="text-sm font-medium text-red-500">
                              {tafsirLanguage === 'ar'
                                ? 'تعذر تحميل التفسير.'
                                : 'English Jalalayn is not available yet.'}
                            </span>
                          ) : (
                            renderBoldedAyahQuotes(tafsir)
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBackFaceMode('translation');
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="mt-1 rounded-full bg-white border border-slate-200 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-600 shadow-sm active:scale-95 transition-all"
                        >
                          Back to Translation
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {pendingTranslationFlip && (
                  <div className="absolute inset-x-0 bottom-0 flex justify-center">
                    <span className="rounded-full bg-white/90 border border-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 shadow-sm">
                      Loading translation
                    </span>
                  </div>
                )}
              </div>
            )}
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
