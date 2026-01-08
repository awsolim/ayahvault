// src/apps/memobuddy/MemoBuddy.tsx

import { useState, useCallback } from 'react';
import Footer from '../../components/layout/Footer';
import { useRandomVerse } from './hooks/useRandomVerse';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { ModeSelector } from './components/ModeSelector';
import { RangeInput } from './components/RangeInput';
import { VerseCard } from './components/VerseCard';
import { PreviewControls } from './components/PreviewControls';
import { InfoToggle } from './components/InfoToggle';
import { CustomSelection } from './components/CustomSelection';
import { SurahReference } from './components/SurahReference'; // NEW Component
import Seo from '../../lib/Seo';

export default function MemoBuddy() {
  const [mode, setMode] = useState<'surah' | 'juz' | 'full' | 'custom' | null>(null);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [useMultiRange, setUseMultiRange] = useState(false);
  
  const [isRefOpen, setIsRefOpen] = useState(false); // Modal state

  const [customConfig, setCustomConfig] = useState({
    type: 'include',
    items: [] as {type: 'surah' | 'juz', val: number}[],
    exact: { startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 7 }
  });

  const [partialMode, setPartialMode] = useState(false);
  const [partialWordCount, setPartialWordCount] = useState(1);
  const [showInfo, setShowInfo] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  const {
    randomVerse, errorMessage,
    generateRandomVerse, navigateToAdjacentVerse
  } = useRandomVerse();

  const handleGo = useCallback(() => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'SELECT')) {
      if (mode === 'custom') return;
    }
    if (!mode) return;
    setHasInteracted(true);
    let config: any = {};
    if (mode === 'surah' || mode === 'juz') {
      config = { 
        start: rangeStart || "1", 
        end: useMultiRange ? (rangeEnd || rangeStart || "1") : (rangeStart || "1") 
      };
    } else if (mode === 'custom') {
      config = customConfig;
    } else if (mode === 'full') {
      config = {};
    }
    generateRandomVerse(mode, config);
  }, [mode, rangeStart, rangeEnd, useMultiRange, customConfig, generateRandomVerse]);

  useKeyboardNav(
    randomVerse, partialMode, handleGo,
    () => setPartialMode(v => !v),
    (delta) => setPartialWordCount(prev => Math.max(1, prev + delta)),
    (offset) => navigateToAdjacentVerse(offset)
  );

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 font-kanit relative">
      <Seo title="MemoBuddy" />
      
      {/* 114 Surahs Reference Modal */}
      <SurahReference isOpen={isRefOpen} onClose={() => setIsRefOpen(false)} />
      
      <h1 className="text-4xl font-bold text-emerald-600 mb-8">MEMOBUDDY</h1>

      <div className="w-full max-w-md">
        <ModeSelector mode={mode} onSelect={(m) => setMode(m)} />

        {/* Small Reference Trigger Button - Properly placed on both mobile/web */}
        {(mode === 'surah' || mode === 'custom') && (
          <div className="flex justify-end mb-2">
            <button 
              onClick={() => setIsRefOpen(true)}
              className="text-[11px] font-bold text-emerald-600/70 hover:text-emerald-600 flex items-center gap-1 uppercase tracking-widest transition-colors"
            >
              <span className="text-sm">📖</span> Surah List
            </button>
          </div>
        )}

        {mode === 'custom' && (
          <CustomSelection config={customConfig} setConfig={setCustomConfig} />
        )}

        {(mode === 'surah' || mode === 'juz') && (
          <RangeInput
            mode={mode}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            useMultiRange={useMultiRange}
            setRangeStart={setRangeStart}
            setRangeEnd={setRangeEnd}
            onGo={handleGo}
            toggleMulti={() => setUseMultiRange(!useMultiRange)}
          />
        )}

        {mode === 'full' && (
          <div className="mb-4 flex justify-center">
            <button
              onClick={handleGo}
              className="w-full px-6 py-3 rounded-xl text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-bold shadow-lg hover:brightness-110 hover:scale-[1.02] transition-all duration-300"
            >
              GO — GENERATE VERSE
            </button>
          </div>
        )}
      </div>

      <VerseCard
        verse={randomVerse}
        errorMessage={errorMessage}
        hasInteracted={hasInteracted}
        partialMode={partialMode}
        partialWordCount={partialWordCount}
        showInfo={showInfo}
        onPrev={() => navigateToAdjacentVerse(-1)}
        onNext={() => navigateToAdjacentVerse(1)}
      />

      <div className="w-full max-w-md px-4 mt-10 space-y-6">
        <div className="grid grid-cols-[auto,1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Preview</span>
          <PreviewControls
            partialMode={partialMode}
            setPartialMode={setPartialMode}
            partialWordCount={partialWordCount}
            setPartialWordCount={setPartialWordCount}
          />
        </div>

        <div className="grid grid-cols-[auto,1fr] items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Verse Info</span>
          <InfoToggle showInfo={showInfo} setShowInfo={setShowInfo} />
        </div>
      </div>

      <Footer />
    </div>
  );
}