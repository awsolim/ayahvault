// src/apps/memobuddy/components/PreviewControls.tsx

import { useInputCapabilities } from '../../../components/hooks/useInputCapabilities';

interface PreviewControlsProps {
  partialMode: boolean;
  setPartialMode: (v: boolean) => void;
  partialWordCount: number;
  setPartialWordCount: (v: number) => void;
}

export function PreviewControls({ partialMode, setPartialMode, partialWordCount, setPartialWordCount }: PreviewControlsProps) {
  const { keyboardCapable } = useInputCapabilities();

  return (
    <div className="flex items-center gap-3">
      {/* Keyboard Hint - sits to the left of the switch */}
      {keyboardCapable && (
        <kbd className="px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono text-slate-500 shadow-sm uppercase">
          Space
        </kbd>
      )}

      {/* Pill Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-full border border-slate-200 shadow-inner">
        <button 
          onClick={() => setPartialMode(false)} 
          className={`px-4 py-1 text-xs font-bold rounded-full transition-all ${!partialMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
        >
          Full
        </button>
        <button 
          onClick={() => setPartialMode(true)} 
          className={`px-4 py-1 text-xs font-bold rounded-full transition-all ${partialMode ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
        >
          Partial
        </button>
      </div>

      {/* Word Count Controls - appears next to it on desktop */}
      {partialMode && (
        <div className="flex items-center gap-1.5 ml-1 animate-in fade-in zoom-in-95 duration-200">
          <button 
            onClick={() => setPartialWordCount(Math.max(1, partialWordCount - 1))} 
            className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-xs font-bold active:scale-90 transition-transform"
          >
            –
          </button>
          <div className="w-8 h-7 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm">
            {partialWordCount}
          </div>
          <button 
            onClick={() => setPartialWordCount(partialWordCount + 1)} 
            className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm text-xs font-bold active:scale-90 transition-transform"
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}