import { useEffect, useState, useCallback } from 'react';
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
  const [isFlipped, setFlipped] = useState(false);

  // Reset to front whenever opened or clue changes
  useEffect(() => {
    if (isOpen) setFlipped(false);
  }, [isOpen, clue]);

  // Reveal handler: toggle flip, mark asked only on first flip
  const handleReveal = useCallback(() => {
    setFlipped(prev => {
      if (!prev && clue) {
        onAsk?.(clue); // NEW: guard + mark as asked exactly once when first flipping to the answer
      }
      return !prev;
    });
  }, [clue, onAsk]);

  // Close handler
  const handleClose = useCallback(() => {
    onClose(); // unchanged
  }, [onClose]);

  // Keyboard shortcuts: Spacebar flips, Enter closes
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleReveal(); // unchanged: space flips
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose();  // unchanged: enter closes
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleReveal, handleClose]);

  if (!isOpen || !clue) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" />

      {/* Modal container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div onClick={e => e.stopPropagation()} className="bg-transparent text-center">
          {/* Card with perspective for flip */}
          <div className="w-80 sm:w-96 h-48 sm:h-56 mb-4" style={{ perspective: '1000px' }}>
            <div
              className="w-full h-full relative transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* Front (Question) */}
              <div
                className="absolute inset-0 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-lg font-bold text-center">{clue.question}</p>
              </div>

              {/* Back (Answer) */}
              <div
                className="absolute inset-0 bg-white rounded-lg shadow-lg p-4"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                {/* 
                  NEW: grid + place-items-center centers short answers perfectly.
                  overflow-y-auto keeps long answers scrollable without breaking layout.
                */}
                <div className="w-full h-full overflow-y-auto grid place-items-center">
                  <p className="text-lg whitespace-pre-line text-center">{clue.answer}</p> {/* NEW: centered answer */}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            <button
              type="button"
              onClick={handleReveal}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              {isFlipped ? 'Show Question' : 'Reveal Answer'}
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
