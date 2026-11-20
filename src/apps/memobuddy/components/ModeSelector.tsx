interface ModeSelectorProps {
  mode: 'surah' | 'juz' | 'full' | 'custom' | null;
  onSelect: (mode: 'surah' | 'juz' | 'full' | 'custom') => void;
}
export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return <div className="practice-modes">{(['surah','juz','full','custom'] as const).map(m => <button key={m} aria-pressed={mode === m} onClick={() => onSelect(m)}>{m === 'full' ? 'Whole Quran' : m.charAt(0).toUpperCase() + m.slice(1)}</button>)}</div>;
}
