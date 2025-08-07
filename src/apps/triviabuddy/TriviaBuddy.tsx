import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Footer from '../../components/layout/Footer';
import Spinner from '../../components/ui/Spinner';
import { FlashcardModal } from './components/FlashcardModal';
import { useModal } from './hooks/useModal';
import type { Clue } from './types';

interface Game {
  id: string;
  name: string;
  teams: string[];
  categories: string[];
  board: Record<string, Record<number, Clue>>;
}

export default function TriviaBuddy() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [isModalOpen, openModal, closeModal] = useModal();
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Clue[]>([]);
  const [scores, setScores] = useState<number[]>([]);

  // load game
  useEffect(() => {
    const raw = localStorage.getItem(`trivia-game-${gameId}`);
    if (raw) {
      const g = JSON.parse(raw) as Game;
      setGame(g);
      setScores(g.teams.map(() => 0));
      const stored = localStorage.getItem(`trivia-asked-${g.id}`);
      if (stored) setAsked(new Set(JSON.parse(stored)));
    }
    setLoading(false);
  }, [gameId]);

  useEffect(() => {
    if (game) {
      localStorage.setItem(
        `trivia-asked-${game.id}`,
        JSON.stringify(Array.from(asked))
      );
    }
  }, [asked, game]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!game) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-red-600">Game not found.</p>
      </div>
    );
  }

  const markAsked = (c: Clue) => {
    const key = `${c.category}-${c.points}`;
    setAsked(s => new Set(s).add(key));
    setHistory(h => (h.some(x => `${x.category}-${x.points}` === key) ? h : [c, ...h]));
    setSelectedClue(null);
  };

  const adjustScore = (i: number, delta: number) =>
    setScores(s => {
      const next = [...s];
      next[i] += delta;   // allow negatives
      return next;
    });

  const { name, categories, board, teams } = game;
  const tiers = [100, 200, 300, 400, 500];

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">{name}</h1>

      {/* Modal */}
      {selectedClue && (
        <FlashcardModal
          key={`${selectedClue.category}-${selectedClue.points}`}
          clue={selectedClue}
          isOpen={isModalOpen}
          onClose={closeModal}
          onAsk={markAsked}
        />
      )}

      {/* Grid */}
      <div
        className="w-full max-w-4xl grid gap-4 mb-6"
        style={{ gridTemplateColumns: `repeat(${categories.length},1fr)` }}
      >
        {categories.map(cat => (
          <div key={cat} className="text-center font-semibold">
            {cat}
          </div>
        ))}
        {tiers.map(pts =>
          categories.map(cat => {
            const clue = board[cat][pts];
            const key = `${cat}-${pts}`;
            return asked.has(key) ? (
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
                {pts}
              </button>
            );
          })
        )}
      </div>

      {/* Teams: flex to match grid width */}
      <div className="w-full max-w-4xl flex gap-4 mb-8">
        {teams.map((t, i) => (
          <div
            key={i}
            className="flex-1 border rounded-lg p-4 flex flex-col items-center space-y-2"
          >
            <h3 className="font-medium">{t || `Team ${i + 1}`}</h3>
            <p className="text-3xl font-bold">{scores[i]}</p>
            <div className="flex space-x-2">
              <button
                onClick={() => adjustScore(i, 100)}
                className="px-4 py-2 bg-green-100 text-green-800 rounded hover:bg-green-200 transition"
              >
                +100
              </button>
              <button
                onClick={() => adjustScore(i, -100)}
                className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition"
              >
                −100
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* History */}
      <section className="w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-4">Questions History</h2>
        {history.length === 0 ? (
          <p className="text-gray-500">No questions revealed yet.</p>
        ) : (
          <table className="min-w-full border-collapse text-left">
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
              {history.map((c, idx) => (
                <tr key={`${c.category}-${c.points}-${idx}`}>
                  <td className="px-4 py-2 border-b">{c.category}</td>
                  <td className="px-4 py-2 border-b">{c.points}</td>
                  <td className="px-4 py-2 border-b">{c.question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Footer />
    </div>
  );
}
