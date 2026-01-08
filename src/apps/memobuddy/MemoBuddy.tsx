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
import { SurahReference } from './components/SurahReference';
import Seo from '../../lib/Seo';

export function MemoBuddy() {
  const [mode, setMode] = useState<'surah' | 'juz' | 'full' | 'custom' | null>(null);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [useMultiRange, setUseMultiRange] = useState(false);
  const [isRefOpen, setIsRefOpen] = useState(false);

  const [customConfig, setCustomConfig] = useState({
    type: 'include' as 'include' | 'exclude' | 'exact',
    items: [] as {type: 'surah' | 'juz', val: number}[],
    exact: { startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 7 }
  });

  const [partialMode, setPartialMode] = useState(false);
  const [partialWordCount, setPartialWordCount] = useState(1);
  const [showInfo, setShowInfo] = useState(false); // Defaulting to OFF
  const [hasInteracted, setHasInteracted] = useState(false);

  // Supabase Table Description
  const appDescription = "";

  const { randomVerse, errorMessage, generateRandomVerse, navigateToAdjacentVerse } = useRandomVerse();

  const handleGo = useCallback(() => {
    if (!mode) return;
    setHasInteracted(true);
    const config = mode === 'surah' || mode === 'juz' 
      ? { start: rangeStart || "1", end: useMultiRange ? (rangeEnd || rangeStart || "1") : (rangeStart || "1") }
      : mode === 'custom' ? customConfig : {};
    generateRandomVerse(mode, config);
  }, [mode, rangeStart, rangeEnd, useMultiRange, customConfig, generateRandomVerse]);

  useKeyboardNav(randomVerse, partialMode, handleGo, () => setPartialMode(v => !v), 
    (delta) => setPartialWordCount(prev => Math.max(1, prev + delta)),
    (offset) => navigateToAdjacentVerse(offset)
  );

  const goBtnClass = "px-8 py-2.5 rounded-lg text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-bold shadow-md hover:brightness-110 active:scale-95 transition-all text-sm";

  return (
    <div className="flex flex-col items-center min-h-screen py-8 px-4 font-kanit">
      <Seo title="MemoBuddy" />
      <SurahReference isOpen={isRefOpen} onClose={() => setIsRefOpen(false)} />
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-emerald-600">MEMOBUDDY</h1>
        <p className="text-gray-500 text-[13px] mt-2 max-w-[280px] mx-auto leading-relaxed italic">
          {appDescription}
        </p>
      </div>

      <div className="w-full max-w-md mb-8"> {/* mb-16 provides safe distance from VerseCard */}
        <ModeSelector mode={mode} onSelect={(m) => setMode(m)} />

        <div className="flex flex-col items-center w-full mt-6">
          {mode === 'custom' && (
            <div className="flex flex-col items-center w-full animate-in fade-in slide-in-from-top-2 duration-300">
              <CustomSelection config={customConfig} setConfig={setCustomConfig} />
              <button onClick={handleGo} className={goBtnClass}>Go</button>
              <button onClick={() => setIsRefOpen(true)} className="mt-5 text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest transition-colors flex items-center gap-1">
                <span className="text-sm">📖</span> Surah List
              </button>
            </div>
          )}

          {(mode === 'surah' || mode === 'juz') && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300 w-full">
              <RangeInput 
                mode={mode} rangeStart={rangeStart} rangeEnd={rangeEnd} 
                useMultiRange={useMultiRange} setRangeStart={setRangeStart} 
                setRangeEnd={setRangeEnd} onGo={handleGo} 
                toggleMulti={() => setUseMultiRange(!useMultiRange)} 
                onOpenList={() => setIsRefOpen(true)}
              />
            </div>
          )}

          {mode === 'full' && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              <button onClick={handleGo} className={goBtnClass}>Go</button>
            </div>
          )}
        </div>
      </div>

      <VerseCard 
        verse={randomVerse} errorMessage={errorMessage} hasInteracted={hasInteracted} 
        partialMode={partialMode} partialWordCount={partialWordCount} showInfo={showInfo} 
        onPrev={() => navigateToAdjacentVerse(-1)} onNext={() => navigateToAdjacentVerse(1)} 
      />

      <div className="w-full max-w-4xl mt-12 flex flex-col md:flex-row items-center justify-center gap-12 md:gap-20 px-4">
        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Preview</span>
          <PreviewControls partialMode={partialMode} setPartialMode={setPartialMode} partialWordCount={partialWordCount} setPartialWordCount={setPartialWordCount} />
        </div>

        <div className="flex flex-col items-center md:items-start gap-2">
          <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">Verse Info</span>
          <InfoToggle showInfo={showInfo} setShowInfo={setShowInfo} />
        </div>
      </div>

      <Footer />
    </div>
  );
}