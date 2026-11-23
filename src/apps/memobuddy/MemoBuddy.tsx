import { useSessionState } from './hooks/useSessionState';
import { AyahSizeControl } from '../../preferences/Preferences';
// src/apps/memobuddy/MemoBuddy.tsx

import { useState, useCallback } from 'react';

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

type PreviewMode = 'text' | 'audio';

function PreviewModeToggle({
  previewMode,
  setPreviewMode,
}: {
  previewMode: PreviewMode;
  setPreviewMode: (mode: PreviewMode) => void;
}) {
  return <div className="setting-segments" role="group" aria-label="Preview format"><button type="button" aria-pressed={previewMode === 'text'} onClick={() => setPreviewMode('text')}>Text</button><button type="button" aria-pressed={previewMode === 'audio'} onClick={() => setPreviewMode('audio')}>Audio</button></div>;
}

export default function MemoBuddy() {
  const [mode, setMode] = useSessionState<'surah' | 'juz' | 'full' | 'custom' | null>('mode', null);
  const [rangeStart, setRangeStart] = useSessionState<string>('rangeStart', '');
  const [rangeEnd, setRangeEnd] = useSessionState<string>('rangeEnd', '');
  const [useMultiRange, setUseMultiRange] = useSessionState('useMultiRange', false);
  const [isRefOpen, setIsRefOpen] = useState(false);

  const [customConfig, setCustomConfig] = useSessionState('customConfig', {
    type: 'include' as 'include' | 'exclude' | 'exact',
    items: [] as {type: 'surah' | 'juz', val: number}[],
    exact: { startSurah: 1, startAyah: 1, endSurah: 1, endAyah: 7 }
  });

  const [partialMode, setPartialMode] = useSessionState('partialMode', false);
  const [partialWordCount, setPartialWordCount] = useSessionState('partialWordCount', 1);
  const [previewMode, setPreviewMode] = useSessionState<PreviewMode>('previewMode', 'text');
  const [audioPartialSeconds, setAudioPartialSeconds] = useSessionState('audioPartialSeconds', 5);
  const [audioPlayRequest, setAudioPlayRequest] = useState(0);
  const [showInfo, setShowInfo] = useSessionState('showInfo', false); // Off by default
  const [hasInteracted, setHasInteracted] = useSessionState('hasInteracted', false);



  const { randomVerse, errorMessage, generateRandomVerse, navigateToAdjacentVerse } = useRandomVerse();

  const handleGo = useCallback(() => {
    if (!mode) return;
    setHasInteracted(true);
    const config = mode === 'surah' || mode === 'juz' 
      ? { start: rangeStart, end: useMultiRange ? rangeEnd : rangeStart }
      : mode === 'custom' ? customConfig : {};
    generateRandomVerse(mode, config);
    if (previewMode === 'audio') {
      setAudioPlayRequest(v => v + 1);
    }
  }, [mode, rangeStart, rangeEnd, useMultiRange, customConfig, generateRandomVerse, previewMode]);

  useKeyboardNav(randomVerse, partialMode, handleGo, () => setPartialMode(v => !v), 
    (delta) => {
      if (previewMode === 'audio') {
        setAudioPartialSeconds(prev => Math.min(60, Math.max(1, prev + delta)));
        return;
      }
      setPartialWordCount(prev => Math.max(1, prev + delta));
    },
    (offset) => navigateToAdjacentVerse(offset)
  );

  const goBtnClass = "memo-primary-button px-6 py-2 rounded-lg text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 font-bold shadow-md hover:brightness-110 active:scale-95 transition-all text-sm";
  const previewModeToggle = (
    <PreviewModeToggle previewMode={previewMode} setPreviewMode={setPreviewMode} />
  );

  return (
    <div className="practice flex flex-col items-center" onPointerDownCapture={event => { event.currentTarget.dataset.keyboardFocus = 'false'; }} onKeyDownCapture={event => { if (event.key === 'Tab') event.currentTarget.dataset.keyboardFocus = 'true'; }}>
      <Seo title="MemoBuddy" />
      <SurahReference isOpen={isRefOpen} onClose={() => setIsRefOpen(false)} />
      
      <h1 className="practice-title">MemoBuddy</h1>
      <p className="practice-subtitle">Random ayah generator with customization</p>

      <div className="memo-setup w-full max-w-md">
        <ModeSelector mode={mode} onSelect={(m) => setMode(m)} />

        <div className="memo-selection flex flex-col items-center w-full">
          {mode === 'custom' && (
            <div className="flex flex-col items-center w-full">
              <CustomSelection config={customConfig} setConfig={setCustomConfig} />
              <div className="flex items-center justify-center gap-2">
                <button onClick={handleGo} className={goBtnClass}>Go</button>
              </div>
              <button onClick={() => setIsRefOpen(true)} className="mt-4 text-[10px] font-bold text-emerald-600/70  tracking-widest flex items-center gap-1">
                <span className="text-sm"></span> Surah List
              </button>
            </div>
          )}

          {(mode === 'surah' || mode === 'juz') && (
            <RangeInput 
              mode={mode} rangeStart={rangeStart} rangeEnd={rangeEnd} 
              useMultiRange={useMultiRange} setRangeStart={setRangeStart} 
              setRangeEnd={setRangeEnd} onGo={handleGo} 
              toggleMulti={() => setUseMultiRange(!useMultiRange)} 
              onOpenList={() => setIsRefOpen(true)}
            />
          )}

          {mode === 'full' && (
            <div className="flex items-center justify-center gap-2">
              <button onClick={handleGo} className={goBtnClass}>Go</button>
            </div>
          )}
        </div>
      </div>

      <VerseCard 
        verse={randomVerse} errorMessage={errorMessage} hasInteracted={hasInteracted} 
        previewMode={previewMode} partialMode={partialMode}
        partialWordCount={partialWordCount} audioPartialSeconds={audioPartialSeconds}
        audioPlayRequest={audioPlayRequest}
        showInfo={showInfo} 
        onPrev={() => navigateToAdjacentVerse(-1)} onNext={() => navigateToAdjacentVerse(1)} 
      />


      <div className="memo-settings">
        <section><h2>Ayah information</h2><InfoToggle showInfo={showInfo} setShowInfo={setShowInfo} /></section>
        <section className="memo-preview-row"><h2>Preview</h2><PreviewControls previewMode={previewMode} partialMode={partialMode} setPartialMode={setPartialMode} partialWordCount={partialWordCount} setPartialWordCount={setPartialWordCount} audioPartialSeconds={audioPartialSeconds} setAudioPartialSeconds={setAudioPartialSeconds} /></section>
        <section><h2>Text / Audio</h2>{previewModeToggle}</section>
        <section><h2>Ayah text size</h2><AyahSizeControl /></section>
      </div>

      <p className="hidden md:block mt-4 text-[11px] font-bold  tracking-widest text-slate-400">
        Use left and right arrow keys to check the previous or following verse
      </p>


    </div>
  );
}
