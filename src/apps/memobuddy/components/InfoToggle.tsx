import { useEffect } from 'react';
interface InfoToggleProps { showInfo: boolean; setShowInfo: (v: boolean | ((prev: boolean) => boolean)) => void; }
export function InfoToggle({ showInfo, setShowInfo }: InfoToggleProps) {
 useEffect(() => {
  const onKey = (event: KeyboardEvent) => {
   if (event.key !== 'Shift' || event.repeat || document.querySelector('dialog[open]')) return;
   if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, [contenteditable=true]')) return;
   setShowInfo(value => !value);
  };
  window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
 }, [setShowInfo]);
 return <div className="setting-segments" role="group" aria-label="Ayah information"><button type="button" aria-pressed={!showInfo} onClick={() => setShowInfo(false)}>Hidden</button><button type="button" aria-pressed={showInfo} onClick={() => setShowInfo(true)}>Shown</button></div>;
}
