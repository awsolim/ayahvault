import { useEffect } from 'react';
import { SettingToggle } from './SettingToggle';
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
 return <SettingToggle label="Ayah information" options={['Hidden', 'Shown']} on={showInfo} toggle={() => setShowInfo(value => !value)} />;
}
