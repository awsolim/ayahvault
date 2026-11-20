interface ModeSelectorProps {
  mode: 'surah' | 'juz' | 'full' | 'custom' | null;
  onSelect: (mode: 'surah' | 'juz' | 'full' | 'custom') => void;
}
export function ModeSelector({ mode, onSelect }: ModeSelectorProps) {
  return <div className="practice-modes">{(['surah','juz','full','custom'] as const).map(m => <button key={m} aria-pressed={mode === m} onClick={() => onSelect(m)}>{{ surah: ['By', 'surah'], juz: ['By', 'juz'], full: ['Whole', 'Quran'], custom: ['Custom', 'range'] }[m].map((line, i) => <span key={i}>{line}</span>)}</button>)}</div>;
}
