type PreviewMode = 'text' | 'audio';
interface PreviewControlsProps {
 previewMode: PreviewMode; partialMode: boolean; setPartialMode: (v: boolean) => void;
 partialWordCount: number; setPartialWordCount: (v: number) => void;
 audioPartialSeconds: number; setAudioPartialSeconds: (v: number) => void;
}
export function PreviewControls({ previewMode, partialMode, setPartialMode, partialWordCount, setPartialWordCount, audioPartialSeconds, setAudioPartialSeconds }: PreviewControlsProps) {
 const audio = previewMode === 'audio';
 const amount = audio ? audioPartialSeconds : partialWordCount;
 const unit = audio ? 'seconds' : 'words';
 const adjust = (offset: number) => audio ? setAudioPartialSeconds(Math.max(1, Math.min(60, amount + offset))) : setPartialWordCount(Math.max(1, Math.min(100, amount + offset)));
 return <>
  <div className="partial-amount" role="group" aria-label={'Partial preview ' + unit} title={'Preview ' + unit} style={{ visibility: partialMode ? 'visible' : 'hidden' }} aria-hidden={!partialMode} inert={!partialMode}><button type="button" disabled={amount <= 1} aria-label={'Decrease preview ' + unit} onClick={() => adjust(-1)}>−</button><output aria-label={amount + ' ' + unit}>{amount}</output><button type="button" disabled={amount >= (audio ? 60 : 100)} aria-label={'Increase preview ' + unit} onClick={() => adjust(1)}>+</button></div>
  <div className="setting-segments" role="group" aria-label="Preview length"><button type="button" aria-pressed={!partialMode} onClick={() => setPartialMode(false)}>Full</button><button type="button" aria-pressed={partialMode} onClick={() => setPartialMode(true)}>Partial</button></div>
 </>;
}
