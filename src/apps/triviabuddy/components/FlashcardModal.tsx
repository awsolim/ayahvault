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

  // Reset flip state whenever the modal is opened or the clue changes
  useEffect(() => {
    if (isOpen) {
      setIsFlipped(false);
    }
  }, [isOpen, clue]);

  // Keyboard handlers: Space → flip, Enter → close (and mark asked if flipped)
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsFlipped(f => !f);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (isFlipped && clue && onAsk) {
          onAsk(clue);
        }
        onClose();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, isFlipped, onAsk, onClose, clue]);

  if (!isOpen || !clue) return null;

  return createPortal(
    <div
      className="
        fixed inset-0
        bg-transparent backdrop-blur-sm backdrop-brightness-50
        flex flex-col items-center justify-center z-50
      "
      onClick={() => {
        if (isFlipped && clue && onAsk) onAsk(clue);
        onClose();
      }}
    >
      {/* Stop closing when clicking inside */}
      <div onClick={e => e.stopPropagation()}>
        {/* 3D container */}
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
            {/* Front Face */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className="
                absolute inset-0
                bg-white rounded-lg shadow-lg p-4
                flex items-center justify-center
              "
            >
              <p className="text-center text-lg font-bold">
                {clue.question}
              </p>
            </div>
            {/* Back Face */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className="
                absolute inset-0
                bg-white rounded-lg shadow-lg p-4
                flex items-center justify-center
              "
            >
              <p className="text-center text-lg">
                {clue.answer}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4 mt-4">
          <button
            onClick={() => setIsFlipped(f => !f)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {isFlipped ? 'Show Question' : 'Reveal Answer'}
          </button>
          <button
            onClick={() => {
              if (isFlipped && clue && onAsk) onAsk(clue);
              onClose();
            }}
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
