import { Link } from 'react-router-dom';
import { usePreferences } from '../../../preferences/Preferences';
// src/apps/memobuddy/components/VerseCard.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import type { Verse } from '../../../assets/types';

type PreviewMode = 'text' | 'audio';


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
        <p className="text-xs font-bold tracking-[0.18em]  text-slate-400">
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

const translationCache = new Map<string, string>();
export function VerseCard(props: VerseCardProps) {
  const key = props.verse ? props.verse.surah + ':' + props.verse.ayah : 'empty';
  return <div className="verse-preview">
    <nav className="verse-navigation" aria-label="Adjacent ayahs"><button type="button" disabled={!props.verse || !!props.errorMessage} onClick={props.onPrev}>Prev</button><button type="button" disabled={!props.verse || !!props.errorMessage} onClick={props.onNext}>Next</button></nav>
    <VerseContent key={key + props.previewMode} {...props} />
  </div>;
}
function VerseContent({ verse, errorMessage, hasInteracted, previewMode, partialMode, partialWordCount, audioPartialSeconds, audioPlayRequest, showInfo }: VerseCardProps) {
  const { ayahSize } = usePreferences();
  const verseKey = verse ? verse.surah + ':' + verse.ayah : '';
  const [showTranslation, setShowTranslation] = useState(false);
  const [requested, setRequested] = useState(false);
  const [translation, setTranslation] = useState(() => translationCache.get(verseKey) || '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  useEffect(() => {
    if (!requested || !verse) return;
    const cached = translationCache.get(verseKey);
    if (cached) { setTranslation(cached); setShowTranslation(true); setRequested(false); return; }
    const controller = new AbortController();
    setStatus('loading');
    fetch('https://api.alquran.cloud/v1/ayah/' + verseKey + '/en.sahih', { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(payload => {
        const text = payload?.data?.text;
        if (typeof text !== 'string' || !text.trim()) throw new Error();
        if (controller.signal.aborted) return;
        translationCache.set(verseKey, text); setTranslation(text); setStatus('idle'); setShowTranslation(true); setRequested(false);
      }).catch(() => { if (!controller.signal.aborted) { setStatus('error'); setRequested(false); } });
    return () => controller.abort();
  }, [requested, verseKey, verse]);
  function flip() {
    if (requested) { setRequested(false); setStatus('idle'); return; }
    if (showTranslation) { setShowTranslation(false); return; }
    if (translation) { setShowTranslation(true); return; }
    setRequested(true);
  }
  if (errorMessage) return <p className="verse-message" role="alert">{errorMessage}</p>;
  if (!hasInteracted || !verse) return <p className="verse-message">Choose a selection and press Go.</p>;
  const displayedText = partialMode ? verse.text.split(' ').slice(0, partialWordCount).join(' ') + ' …' : verse.text;
  return <div className="verse-content">
    <Link className="verse-mushaf-link" to={'/mushaf?ayah=' + verseKey} state={{ from: 'memobuddy' }}>Mushaf</Link>
    <div className="verse-reference" style={{ visibility: showInfo ? 'visible' : 'hidden' }}>{verse.surahName} · Surah {verse.surah} · Ayah {verse.ayah} · Juz {verse.juz}</div>
    {previewMode === 'audio' ? <AudioVersePreview verse={verse} partialMode={partialMode} audioPartialSeconds={audioPartialSeconds} audioPlayRequest={audioPlayRequest} showInfo={showInfo} /> : <>
      <div className="verse-flip" role="button" tabIndex={0} aria-label={showTranslation ? 'Show Arabic ayah' : requested ? 'Cancel loading translation' : 'Show English translation'} aria-pressed={showTranslation} onClick={flip} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flip(); } }}>
        <div className={'verse-flip-inner' + (showTranslation ? ' is-translated' : '')}>
          <div className="verse-face verse-arabic" aria-hidden={showTranslation}><p dir="rtl" lang="ar" style={{ fontSize: ayahSize }}>{displayedText}</p></div>
          <div className="verse-face verse-translation" aria-hidden={!showTranslation}><p>{translation}</p><span>Sahih International</span></div>
        </div>
      </div>
      <div className="translation-feedback" aria-live="polite">{status === 'loading' ? 'Loading translation…' : status === 'error' ? <button type="button" onClick={() => setRequested(true)}>Translation unavailable. Try again</button> : ''}</div>
    </>}
  </div>;
}
export default VerseCard;
