import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import chapters from '../../../assets/chapters.json';
interface SurahReferenceProps { isOpen: boolean; onClose: () => void; }
export function SurahReference({ isOpen, onClose }: SurahReferenceProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element || !isOpen) return;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  if (!isOpen) return null;
  return createPortal(<dialog ref={dialog} className="surah-reference" aria-labelledby="surah-reference-title" onCancel={onClose} onClick={event => {
    if (event.target !== dialog.current) return;
    const rect = dialog.current.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
  }}><header><h2 id="surah-reference-title">Surah list</h2><button type="button" onClick={onClose} aria-label="Close surah list">×</button></header><ol>{chapters.map(c => <li key={c.id}><span>{c.id}</span><span>{c.name}</span></li>)}</ol><footer><button type="button" onClick={onClose}>Close</button></footer></dialog>, document.body);
}
