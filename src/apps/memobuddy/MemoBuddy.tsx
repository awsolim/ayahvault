import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import { useRandomVerse } from './hooks/useRandomVerse';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { ModeSelector } from './components/ModeSelector';
import { RangeInput } from './components/RangeInput';
import { VerseCard } from './components/VerseCard';
import { PreviewControls } from './components/PreviewControls';
import { InfoToggle } from './components/InfoToggle';
import Seo from '../../lib/Seo';

export function MemoBuddy() {
  const nav = useNavigate();

  // UI state
  const [mode, setMode] = useState<'surah' | 'juz' | null>(null);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [useMultiRange, setUseMultiRange] = useState(false);
  const [partialMode, setPartialMode] = useState(false);
  const [partialWordCount, setPartialWordCount] = useState(1);
  const [showInfo, setShowInfo] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Logic hooks
  const {
    randomVerse, errorMessage,
    generateRandomVerse, navigateToAdjacentVerse
  } = useRandomVerse();

  // Keyboard nav
  useKeyboardNav(
    randomVerse,
    partialMode,
    () => {
      setHasInteracted(true);
      const start = Number(rangeStart);
      const end = useMultiRange ? Number(rangeEnd) : start;
      generateRandomVerse(mode!, start, end);
    },
    () => setPartialMode(p => !p),
    (delta) => setPartialWordCount(c => Math.max(1, c + delta)),
    (offset) => {
      const start = Number(rangeStart);
      const end = useMultiRange ? Number(rangeEnd) : start;
      navigateToAdjacentVerse(offset, mode!, start, end);
    }
  );

  // Touch UI prev/next handlers for VerseCard
  const handlePrev = useCallback(() => {
    if (!mode) return;
    const start = Number(rangeStart);
    const end = useMultiRange ? Number(rangeEnd) : start;
    navigateToAdjacentVerse(-1, mode, start, end);
  }, [mode, rangeStart, rangeEnd, useMultiRange, navigateToAdjacentVerse]);

  const handleNext = useCallback(() => {
    if (!mode) return;
    const start = Number(rangeStart);
    const end = useMultiRange ? Number(rangeEnd) : start;
    navigateToAdjacentVerse(1, mode, start, end);
  }, [mode, rangeStart, rangeEnd, useMultiRange, navigateToAdjacentVerse]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-900">
      <Seo
        title="MemoBuddy – Random Quran Verse Generator | AyahVault"
        description="Generate random Quran verses by Surah or Juz for memorization and reflection. Toggle partial previews and navigate verses easily."
        canonical="https://ayahvault.com/memobuddy"
        ogTitle="MemoBuddy – Random Quran Verse Generator"
        ogDescription="Select Surah or Juz and get a random ayah for practice."
        ogImage="https://ayahvault.com/og/memobuddy.png"
        ogUrl="https://ayahvault.com/memobuddy"
        keywords="random Quran verse, Quran memorization, Surah generator, Juz generator"
      />

      {/* Home button */}
      <button
        onClick={() => nav('/')}
        className="fixed top-4 left-4 bg-white border border-slate-300 rounded-full px-3 py-2 text-sm font-medium shadow hover:bg-emerald-50"
      >
        ← Home
      </button>

      <h1 className="text-3xl font-bold text-emerald-600 mb-4">MemoBuddy - Quran Memorization Assistant</h1>

      {/* 1. Mode selector */}
      <ModeSelector
        mode={mode}
        onSelect={m => {
          setMode(m);
          setRangeStart('');
          setRangeEnd('');
          setUseMultiRange(false);
          setHasInteracted(false);
        }}
      />

      {/* 2. Range inputs + Go */}
      {mode && (
        <RangeInput
          mode={mode}
          rangeStart={rangeStart} setRangeStart={setRangeStart}
          rangeEnd={rangeEnd}     setRangeEnd={setRangeEnd}
          useMultiRange={useMultiRange}
          onGo={() => {
            setHasInteracted(true);
            const start = Number(rangeStart);
            const end = useMultiRange ? Number(rangeEnd) : start;
            generateRandomVerse(mode, start, end);
          }}
          toggleMulti={() => setUseMultiRange(p => !p)}
        />
      )}

      {/* 3. Verse display */}
      <VerseCard
        verse={randomVerse}
        errorMessage={errorMessage}
        hasInteracted={hasInteracted}
        partialMode={partialMode}
        partialWordCount={partialWordCount}
        showInfo={showInfo}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* 4. Settings — two aligned rows */}
      <div
        className="
          w-full max-w-md px-4
          mt-10               /* push settings down from the verse card */
          space-y-6
        "
      >
        {/* Row 1: Preview — label (col 1) | controls (col 2) */}
        <div className="grid grid-cols-[auto,1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Preview</span>
          <PreviewControls
            partialMode={partialMode}
            setPartialMode={setPartialMode}
            partialWordCount={partialWordCount}
            setPartialWordCount={setPartialWordCount}
          />
        </div>

        {/* Row 2: Verse Info — label (col 1) | controls (col 2) */}
        <div className="grid grid-cols-[auto,1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Verse Info</span>
          <InfoToggle
            showInfo={showInfo}
            setShowInfo={setShowInfo}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default MemoBuddy;
