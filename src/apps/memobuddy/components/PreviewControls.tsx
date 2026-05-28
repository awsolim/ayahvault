// src/apps/memobuddy/components/PreviewControls.tsx

import { useInputCapabilities } from '../../../components/hooks/useInputCapabilities';

type PreviewMode = 'text' | 'audio';

interface PreviewControlsProps {
  previewMode: PreviewMode;
  partialMode: boolean;
  setPartialMode: (v: boolean) => void;
  partialWordCount: number;
  setPartialWordCount: (v: number) => void;
  audioPartialSeconds: number;
  setAudioPartialSeconds: (v: number) => void;
}

export function PreviewControls({
  previewMode,
  partialMode,
  setPartialMode,
  partialWordCount,
  setPartialWordCount,
  audioPartialSeconds,
  setAudioPartialSeconds,
}: PreviewControlsProps) {
  const { keyboardCapable } = useInputCapabilities();
  const activeValue = previewMode === 'audio' ? audioPartialSeconds : partialWordCount;
  const label = previewMode === 'audio' ? 'sec' : 'words';

  const adjustPartialAmount = (delta: number) => {
    if (previewMode === 'audio') {
      setAudioPartialSeconds(Math.min(60, Math.max(1, audioPartialSeconds + delta)));
      return;
    }
    setPartialWordCount(Math.max(1, partialWordCount + delta));
  };
  const nextPartialMode = !partialMode;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        {keyboardCapable && (
          <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-500 shadow-sm uppercase">
            Space
          </kbd>
        )}

        {/* Length Toggle */}
        <button
          type="button"
          onClick={() => setPartialMode(nextPartialMode)}
          className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner"
          aria-label={`Switch to ${nextPartialMode ? 'partial' : 'full'} preview`}
        >
          <span className={`px-4 py-1 text-xs font-bold rounded-full transition-all ${!partialMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>
            Full
          </span>
          <span
            className={`px-4 py-1 text-xs font-bold rounded-full transition-all ${partialMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
          >
            Partial
          </span>
        </button>

        {/* Amount Controls */}
        {partialMode && (
          <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
            <button 
              type="button"
              onClick={() => adjustPartialAmount(-1)}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-xs font-bold active:scale-90 transition-transform"
              aria-label={`Decrease partial ${label}`}
            >
              -
            </button>
            <div className="min-w-12 h-7 px-2 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm tabular-nums">
              {activeValue}<span className="ml-0.5 text-[9px] text-slate-400">{previewMode === 'audio' ? 's' : ''}</span>
            </div>
            <button 
              type="button"
              onClick={() => adjustPartialAmount(1)}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-xs font-bold active:scale-90 transition-transform"
              aria-label={`Increase partial ${label}`}
            >
              +
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
