type PreviewMode = 'text' | 'audio';
interface PreviewControlsProps {
 previewMode: PreviewMode; partialMode: boolean; setPartialMode: (v: boolean) => void;
 partialWordCount: number; setPartialWordCount: (v: number) => void;
 audioPartialSeconds: number; setAudioPartialSeconds: (v: number) => void;
}
export function PreviewControls({ previewMode, partialMode, setPartialMode, partialWordCount, setPartialWordCount, audioPartialSeconds, setAudioPartialSeconds }: PreviewControlsProps) {
 const audio = previewMode === 'audio';
 const amount = audio ? audioPartialSeconds : partialWordCount;
 const adjust = (offset: number) => audio ? setAudioPartialSeconds(Math.max(1, Math.min(60, amount + offset))) : setPartialWordCount(Math.max(1, Math.min(100, amount + offset)));
 return <div className="preview-setting"><div className="setting-segments" role="group" aria-label="Preview length"><button type="button" aria-pressed={!partialMode} onClick={() => setPartialMode(false)}>Full</button><button type="button" aria-pressed={partialMode} onClick={() => setPartialMode(true)}>Partial</button></div>
 {partialMode && <div className="partial-amount"><button type="button" disabled={amount <= 1} aria-label="Decrease preview length" onClick={() => adjust(-1)}>−</button><output>{amount} {audio ? 'sec' : amount === 1 ? 'word' : 'words'}</output><button type="button" disabled={amount >= (audio ? 60 : 100)} aria-label="Increase preview length" onClick={() => adjust(1)}>+</button></div>}</div>;
}
