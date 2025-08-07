import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Clue } from '../types';

interface FlashcardModalProps {
  clue: Clue | null;
  isOpen: boolean;
  onClose: () => void;
  onAsk?: (clue: Clue) => void;
}

export function FlashcardModal({
  clue,
  isOpen,
  onClose,
  onAsk,
}: FlashcardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  // Reset to front whenever opened or clue changes
  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
    }
  }, [isOpen, clue]);

  // Keyboard: Space toggles flip (and marks asked once), Enter closes only
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped(prev => {
          const next = !prev;
          if (next && clue && onAsk) {
            onAsk(clue);  // only here on reveal
          }
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onClose();     // never mark asked here
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, clue, onAsk, onClose]);

  if (!isOpen || !clue) return null;

  return createPortal(
    <div
      className="
        fixed inset-0
        bg-transparent backdrop-blur-sm backdrop-brightness-50
        flex flex-col items-center justify-center z-50
      "
      onClick={onClose}   // close only
    >
      <div onClick={e => e.stopPropagation()}>
        <div className="w-80 h-48" style={{ perspective: '1000px' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              transition: 'transform 0.6s',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className="absolute inset-0 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center"
            >
              <p className="text-center text-lg font-bold">
                {clue.question}
              </p>
            </div>
            {/* Back */}
            <div
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute inset-0 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center"
            >
              <p className="text-center text-lg">
                {clue.answer}
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-4 justify-center">
          <button
            onClick={() =>
              setIsFlipped(prev => {
                const next = !prev;
                if (next && clue && onAsk) onAsk(clue);
                return next;
              })
            }
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {isFlipped ? 'Show Question' : 'Reveal Answer'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default FlashcardModal;
