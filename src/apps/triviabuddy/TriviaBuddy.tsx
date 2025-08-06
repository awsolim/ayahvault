import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Footer from '../../components/layout/Footer';
import { FlashcardModal } from './components/FlashCardModal';
import { useModal } from './hooks/useModal';
import type { Clue } from './types';

export function TriviaBuddy() {
  const [clues, setClues] = useState<Clue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [isModalOpen, openModal, closeModal] = useModal();

  // Track which clues have been asked (persisted in localStorage)
  const [askedClues, setAskedClues] = useState<Set<string>>(new Set());

  // Hydrate askedClues from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('trivia-asked');
    if (stored) {
      setAskedClues(new Set(JSON.parse(stored)));
    }
  }, []);

  // Persist askedClues to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      'trivia-asked',
      JSON.stringify(Array.from(askedClues))
    );
  }, [askedClues]);

  // Fetch clues from Supabase
  useEffect(() => {
    async function loadClues() {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('triviabuddy')
        .select('*');

      if (fetchError) {
        console.error(fetchError);
        setError(fetchError.message);
      } else if (!data || data.length === 0) {
        setError('No clues found in the database.');
      } else {
        setClues(data as Clue[]);
      }

      setLoading(false);
    }
    loadClues();
  }, []);

  // Helpers for grid
  const categories = Array.from(new Set(clues.map(c => c.category)));
  const pointsTiers = [100, 200, 300, 400, 500];
  const clueKey = (c: Clue) => `${c.category}-${c.points}`;

  // Mark a clue as asked
  const handleAsked = (clue: Clue) => {
    setAskedClues(prev => new Set(prev).add(clueKey(clue)));
  };

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">TriviaBuddy</h1>

      {/* Remounting the modal on each selectedClue ensures isFlipped=false on open */}
      {selectedClue && (
        <FlashcardModal
          key={clueKey(selectedClue)}
          clue={selectedClue}
          isOpen={isModalOpen}
          onClose={closeModal}
          onAsk={handleAsked}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading…</p>
        </div>
      )}

      {/* Error or empty-data */}
      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Jeopardy grid */}
      {!loading && !error && (
        <div className="flex-1 w-full max-w-4xl grid grid-cols-5 gap-4 mb-8">
          {/* Column headers */}
          {categories.map(cat => (
            <div key={cat} className="text-center font-semibold">
              {cat}
            </div>
          ))}

          {/* Tiles */}
          {pointsTiers.map(points =>
            categories.map(cat => {
              const clue = clues.find(
                c => c.category === cat && c.points === points
              )!;
              const key = clueKey(clue);
              const asked = askedClues.has(key);

              return asked ? (
                <div key={key} className="h-20 bg-blue-300 rounded" />
              ) : (
                <button
                  key={key}
                  className="h-20 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition"
                  onClick={() => {
                    setSelectedClue(clue);
                    openModal();
                  }}
                >
                  {points}
                </button>
              );
            })
          )}
        </div>
      )}

      <Footer />
    </div>
  );
}

export default TriviaBuddy;
