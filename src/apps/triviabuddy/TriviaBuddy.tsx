import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Footer from '../../components/layout/Footer';
import { FlashcardModal } from './components/FlashcardModal';
import { useModal } from './hooks/useModal';
import type { Clue } from './types';

export function TriviaBuddy() {
  const [clues, setClues] = useState<Clue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [isModalOpen, openModal, closeModal] = useModal();

  // Persisted asked set
  const [askedClues, setAskedClues] = useState<Set<string>>(new Set());
  // History list
  const [history, setHistory] = useState<Clue[]>([]);

  // Hydrate asked from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('trivia-asked');
    if (stored) setAskedClues(new Set(JSON.parse(stored)));
  }, []);

  // Persist asked to localStorage
  useEffect(() => {
    localStorage.setItem('trivia-asked', JSON.stringify(Array.from(askedClues)));
  }, [askedClues]);

  // Load clues
  useEffect(() => {
    async function loadClues() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase.from('triviabuddy').select('*');
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

  const categories = Array.from(new Set(clues.map(c => c.category)));
  const pointsTiers = [100, 200, 300, 400, 500];
  const clueKey = (c: Clue) => `${c.category}-${c.points}`;

  // Idempotent asked handler
  const handleAsked = (clue: Clue) => {
    const key = clueKey(clue);
    setAskedClues(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    setHistory(prev => {
      if (prev.find(c => clueKey(c) === key)) return prev;
      return [clue, ...prev];
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">TriviaBuddy</h1>

      {selectedClue && (
        <FlashcardModal
          key={clueKey(selectedClue)}
          clue={selectedClue}
          isOpen={isModalOpen}
          onClose={closeModal}
          onAsk={handleAsked}
        />
      )}

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-600">Loading…</p>
        </div>
      )}

      {!loading && error && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-red-600 font-medium">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 w-full max-w-4xl grid grid-cols-5 gap-4 mb-8">
          {categories.map(cat => (
            <div key={cat} className="text-center font-semibold">
              {cat}
            </div>
          ))}

          {pointsTiers.map(points =>
            categories.map(cat => {
              const clue = clues.find(c => c.category === cat && c.points === points)!;
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

      {/* Questions History */}
<section className="w-full max-w-4xl mt-12">
  <h2 className="text-2xl font-semibold mb-4">Questions History</h2>

  {history.length === 0 ? (
    <p className="text-gray-500">No questions revealed yet.</p>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left border-collapse">
        <colgroup>
          <col style={{ width: '15%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '70%' }} />
        </colgroup>
        <thead>
          <tr>
            <th className="px-4 py-2 border-b">Category</th>
            <th className="px-4 py-2 border-b">Points</th>
            <th className="px-4 py-2 border-b">Question</th>
          </tr>
        </thead>
        <tbody>
          {history.map((clue, idx) => (
            <tr key={`${clueKey(clue)}-${idx}`}>
              <td className="px-4 py-2 border-b">{clue.category}</td>
              <td className="px-4 py-2 border-b">{clue.points}</td>
              <td className="px-4 py-2 border-b">{clue.question}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</section>

      <Footer />
    </div>
  );
}

export default TriviaBuddy;
