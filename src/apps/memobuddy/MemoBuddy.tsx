import { useMemoSession } from './hooks/useMemoSession';
import { visibilityLabels, validVisibility } from './practiceModel';
import { AyahSizeControl, usePreferences } from '../../preferences/Preferences';
import { validAyahTapAction } from './tapAction';
// src/apps/memobuddy/MemoBuddy.tsx

import { useState, useCallback } from 'react';

import { useKeyboardNav } from './hooks/useKeyboardNav';
import { ModeSelector } from './components/ModeSelector';
import { RangeInput } from './components/RangeInput';
import { VerseCard } from './components/VerseCard';
import { PreviewControls } from './components/PreviewControls';
import { InfoToggle } from './components/InfoToggle';
import { SettingToggle } from './components/SettingToggle';
import { CustomSelection } from './components/CustomSelection';
import { SurahReference } from './components/SurahReference';
import Seo from '../../lib/Seo';


export default function MemoBuddy() {
  const { ayahTapAction, setAyahTapAction, mushafVisibility, setMushafVisibility } = usePreferences();
  const { mode,setMode,rangeStart,setRangeStart,rangeEnd,setRangeEnd,useMultiRange,setUseMultiRange,customConfig,setCustomConfig,partialMode,setPartialMode,partialWordCount,setPartialWordCount,previewMode,setPreviewMode,audioPartialSeconds,setAudioPartialSeconds,showInfo,setShowInfo,hasInteracted,randomVerse,errorMessage,navigateToAdjacentVerse,generate } = useMemoSession();
  const [isRefOpen,setIsRefOpen]=useState(false);
  const [audioPlayRequest,setAudioPlayRequest]=useState(0);
  const handleGo=useCallback(()=>{const result=generate();if(result&&previewMode==='audio')setAudioPlayRequest(v=>v+1);},[generate,previewMode]);

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
        tapAction={ayahTapAction} onToggleInfo={() => setShowInfo(value => !value)} onGenerate={handleGo}
        onPrev={() => navigateToAdjacentVerse(-1)} onNext={() => navigateToAdjacentVerse(1)} 
      />


      <div className="memo-settings">
        <section className="memo-toggle-row"><InfoToggle showInfo={showInfo} setShowInfo={setShowInfo} /></section>
        <section className="memo-tap-row"><h2><label htmlFor="ayah-tap-action">Tap on Ayah</label></h2><div className="memo-tap-control"><select id="ayah-tap-action" value={ayahTapAction} onChange={event => { if (validAyahTapAction(event.target.value)) setAyahTapAction(event.target.value); }} aria-describedby={ayahTapAction === 'adjacent' ? 'ayah-tap-navigation-hint' : undefined}><option value="translation">Translation</option><option value="information">Toggle Ayah Information</option><option value="adjacent">Previous / Next Ayah</option><option value="generate">Generate New Ayah</option></select>{ayahTapAction === 'adjacent' && <p id="ayah-tap-navigation-hint">Left: Previous · Right: Next</p>}</div></section>
        <section className="memo-tap-row"><h2><label htmlFor="mushaf-visibility">Mushaf Visibility</label></h2><div className="memo-tap-control"><select id="mushaf-visibility" value={mushafVisibility} onChange={event=>{if(validVisibility(event.target.value))setMushafVisibility(event.target.value);}}>{Object.entries(visibilityLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></div></section>
        <section className="memo-toggle-row memo-preview-row"><PreviewControls previewMode={previewMode} partialMode={partialMode} setPartialMode={setPartialMode} partialWordCount={partialWordCount} setPartialWordCount={setPartialWordCount} audioPartialSeconds={audioPartialSeconds} setAudioPartialSeconds={setAudioPartialSeconds} /></section>
        <section className="memo-toggle-row"><SettingToggle label="Text / Audio" options={['Text', 'Audio']} on={previewMode === 'audio'} toggle={() => setPreviewMode(previewMode === 'audio' ? 'text' : 'audio')} /></section>
        <section><h2>Ayah text size</h2><AyahSizeControl /></section>
      </div>

      <p className="hidden md:block mt-4 text-[11px] font-bold  tracking-widest text-slate-400">
        Use left and right arrow keys to check the previous or following verse
      </p>


    </div>
  );
}
