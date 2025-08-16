// src/apps/memobuddy/components/VerseCard.tsx

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import surahNames from '../../../assets/surahnames';
import type { Verse } from '../../../assets/types';

// NEW: tiny in-memory cache so each verse translation is fetched once per session
const translationCache = new Map<string, string>();

// You can switch editions if you want (e.g., "en.sahih", "en.yusufali")
const DEFAULT_EDITION = 'en.pickthall';

interface VerseCardProps {
  verse: Verse | null;
  errorMessage: string;
  hasInteracted: boolean;
  partialMode: boolean;
  partialWordCount: number;
  showInfo: boolean;
}

export function VerseCard({
  verse, errorMessage, hasInteracted,
  partialMode, partialWordCount, showInfo
}: VerseCardProps) {
  // NEW: flipping & fetch state
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [translation, setTranslation] = useState('');

  // NEW: stable edition ref + cache key "surah:ayah:edition"
  const editionRef = useRef(DEFAULT_EDITION);
  const cacheKey = verse ? `${verse.surah}:${verse.ayahInSurah}:${editionRef.current}` : '';

  // NEW: refs for measuring both faces to maintain container height (prevents overlap)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const backRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number>(200); // sensible default

  // NEW: fetch translation once on demand (first flip to the back)
  const ensureTranslation = async () => {
    if (!verse) return;
    if (translationCache.has(cacheKey)) {
      setTranslation(translationCache.get(cacheKey)!);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      // AlQuran Cloud per-ayah endpoint, e.g. /ayah/2:255/en.pickthall
      const url = `https://api.alquran.cloud/v1/ayah/${verse.surah}:${verse.ayahInSurah}/${editionRef.current}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const text: string | undefined = json?.data?.text;
      if (!text) throw new Error('Missing translation text');
      translationCache.set(cacheKey, text);
      setTranslation(text);
    } catch {
      setFetchError('Couldn’t load translation. Click to retry.');
    } finally {
      setLoading(false);
    }
  };

  // NEW: flip handler — on first flip to back, fetch translation
  const onFlip = async () => {
    if (!verse) return;
    if (!flipped) {
      await ensureTranslation();
    }
    setFlipped(f => !f);
  };

  // NEW: measure & lock container height to the tallest face (prevents overlapping other components)
  const recalcHeight = () => {
    const f = frontRef.current;
    const b = backRef.current;
    if (!f || !b) return;
    // Take the larger of front/back heights
    const next = Math.max(f.offsetHeight, b.offsetHeight);
    setContainerHeight(next);
  };

  // Recalculate on mount / verse change / flip / translation load
  useLayoutEffect(() => {
    recalcHeight();
    // Also observe size changes (e.g., when translation arrives, window resizes)
    const ro = new ResizeObserver(() => recalcHeight()); // NEW: react to content changes
    if (frontRef.current) ro.observe(frontRef.current);
    if (backRef.current) ro.observe(backRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verse?.surah, verse?.ayahInSurah, flipped, loading, translation]);

  // Also re-measure on window resize
  useEffect(() => {
    const onResize = () => recalcHeight();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Reset when verse changes (ensure front face is shown)
  useEffect(() => {
    setFlipped(false);
    setFetchError(null);
    setLoading(false);
    setTranslation('');
  }, [verse?.surah, verse?.ayahInSurah]);

  // Keep your existing UX for empty/error states
  if (!hasInteracted) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
        <p className="text-gray-500">Select a mode and enter a number to generate a verse.</p>
      </div>
    );
  }
  if (errorMessage) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center">
        <p className="text-red-600 font-medium">{errorMessage}</p>
      </div>
    );
  }
  if (!verse) return null;

  return (
    // NEW: outer wrapper is a normal block element; it reserves space and never overlays siblings
    <div className="max-w-md w-full mx-auto">
      {/* NEW: clickable 3D flip container with hover grow for affordance */}
      <button
        onClick={onFlip}
        className={[
          "relative w-full block focus:outline-none select-none",
          "transition-transform duration-200 hover:scale-105", // NEW: subtle growth on hover
        ].join(" ")}
        aria-label={`Verse ${verse.surah}:${verse.ayahInSurah} ${flipped ? 'translation' : 'arabic'}`}
        style={{ perspective: '1200px' }} // NEW: 3D depth like your TriviaBuddy flip
      >
        <div
          ref={containerRef}
          className="relative w-full rounded-xl"
          // NEW: explicit height matching the tallest face; prevents overlap with settings/footer
          style={{
            height: `${containerHeight}px`,
            transformStyle: 'preserve-3d',
            transition: 'transform 420ms cubic-bezier(.22,.61,.36,1)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT — Arabic side */}
          <div
            ref={frontRef} // NEW
            className="absolute inset-0 bg-white rounded-xl shadow-md p-6 text-center"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }} // NEW
          >
            {showInfo && (
              <p className="text-gray-600 text-sm mb-2">
                Surah {verse.surah}: {surahNames[verse.surah]} &nbsp;&nbsp;
                Ayah: {verse.ayahInSurah} &nbsp; Juz: {verse.juz}
              </p>
            )}
            <p className="text-2xl font-semibold text-gray-800 leading-loose" dir="rtl">
              {partialMode
                ? '… ' + verse.text.split(' ').slice(0, partialWordCount).join(' ')
                : verse.text}
            </p>
            
          </div>

          {/* BACK — English translation side */}
          <div
            ref={backRef} // NEW
            className="absolute inset-0 bg-white rounded-xl shadow-md p-6 text-center"
            style={{
              transform: 'rotateY(180deg)', // NEW
              backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Keep verse info on the back; italicized */}
            {showInfo && (
              <p className="text-gray-600 text-sm mb-2 italic">
                Surah {verse.surah}: {surahNames[verse.surah]} &nbsp;&nbsp;
                Ayah: {verse.ayahInSurah} &nbsp; Juz: {verse.juz}
              </p>
            )}

            <div className="leading-relaxed" dir="ltr">
              {loading ? (
                <span className="text-slate-500">Loading…</span>
              ) : fetchError ? (
                <span className="text-rose-600">{fetchError}</span>
              ) : (
                <span className="text-lg text-gray-900">{translation}</span>
              )}
              <div className="mt-2 text-xs text-slate-400">
                Source: {editionRef.current}
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">(Click to show Arabic)</p>
          </div>
        </div>
      </button>
    </div>
  );
}

export default VerseCard;
