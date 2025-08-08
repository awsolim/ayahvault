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
      if (!prev) {
        onAsk?.(clue!); // mark as asked exactly once
      }
      return !prev;
    });
  }, [clue, onAsk]);

  // Close handler
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Keyboard shortcuts: Spacebar flips, Enter closes
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handleReveal();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, handleReveal, handleClose]);

  if (!isOpen || !clue) return null;

  return createPortal(
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-transparent backdrop-blur-sm backdrop-brightness-50" />

      {/* modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div onClick={e => e.stopPropagation()} className="bg-transparent text-center">
          {/* card */}
          <div className="w-80 h-48 mb-4" style={{ perspective: '1000px' }}>
            <div
              className="w-full h-full relative transition-transform duration-500"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}
            >
              {/* front */}
              <div
                className="absolute inset-0 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-lg font-bold">{clue.question}</p>
              </div>
              {/* back */}
              <div
                className="absolute inset-0 bg-white rounded-lg shadow-lg p-4 flex items-center justify-center"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <p className="text-lg">{clue.answer}</p>
              </div>
            </div>
          </div>

          {/* buttons */}
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
