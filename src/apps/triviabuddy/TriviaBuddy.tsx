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
  progress?: {
    askedClues: string[];
    teamScores: number[];
    history: Clue[];
  };
}

export default function TriviaBuddy() {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal
  const [selectedClue, setSelectedClue] = useState<Clue | null>(null);
  const [isModalOpen, openModal, closeModal] = useModal();

  // Progress
  const [askedClues, setAskedClues] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<Clue[]>([]);
  const [teamScores, setTeamScores] = useState<number[]>([]);

  // Load & restore
  useEffect(() => {
    const raw = localStorage.getItem(`trivia-game-${gameId}`);
    if (raw) {
      const g: Game = JSON.parse(raw);
      setGame(g);
      if (g.progress) {
        setAskedClues(new Set(g.progress.askedClues));
        setHistory(g.progress.history);
        setTeamScores(g.progress.teamScores);
      } else {
        setTeamScores(g.teams.map(() => 0));
      }
    }
    setLoading(false);
  }, [gameId]);

  // Persist asked‐set on the fly (optional)
  useEffect(() => {
    if (game) {
      localStorage.setItem(
        `trivia-asked-${game.id}`,
        JSON.stringify(Array.from(askedClues))
      );
    }
  }, [askedClues, game]);

  // **Autosave full progress on unmount**
  useEffect(() => {
    return () => {
      if (!game) return;
      const raw = localStorage.getItem(`trivia-game-${game.id}`);
      if (!raw) return;
      const stored: Game = JSON.parse(raw);
      stored.progress = {
        askedClues: Array.from(askedClues),
        teamScores,
        history,
      };
      localStorage.setItem(`trivia-game-${game.id}`, JSON.stringify(stored));
    };
  }, [game, askedClues, teamScores, history]);

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

  // Helpers
  const keyFor = (c: Clue) => `${c.category}-${c.points}`;
  const handleAsked = (clue: Clue) => {
    const key = keyFor(clue);
    setAskedClues(prev => (prev.has(key) ? prev : new Set(prev).add(key)));
    setHistory(prev => (prev.some(x => keyFor(x) === key) ? prev : [clue, ...prev]));
  };
  const adjustScore = (i: number, delta: number) => {
    setTeamScores(prev => {
      const next = [...prev];
      next[i] += delta;
      return next;
    });
  };

  const { name, categories, board, teams } = game;
  const tiers = [100, 200, 300, 400, 500];

  return (
    <div className="min-h-screen px-4 py-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">{name}</h1>

      {selectedClue && isModalOpen && (
        <FlashcardModal
          clue={selectedClue}
          isOpen={isModalOpen}
          onAsk={handleAsked}
          onClose={() => { closeModal(); setSelectedClue(null); }}
        />
      )}

      {/* Jeopardy Grid */}
      <div
        className="w-full max-w-4xl grid gap-4 mb-6"
        style={{ gridTemplateColumns: `repeat(${categories.length},1fr)` }}
      >
        {categories.map(cat => (
          <div key={cat} className="text-center font-semibold">{cat}</div>
        ))}
        {tiers.flatMap(pts =>
          categories.map(cat => {
            const clue = board[cat][pts];
            const key = keyFor(clue);
            const asked = askedClues.has(key);
            return asked ? (
              <div key={key} className="h-20 bg-blue-300 rounded" />
            ) : (
              <button
                key={key}
                className="h-20 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition"
                onClick={() => { setSelectedClue(clue); openModal(); }}
              >
                {pts}
              </button>
            );
          })
        )}
      </div>

      {/* Team Scores */}
      <div className="w-full max-w-4xl flex gap-4 mb-8">
        {teams.map((t, i) => (
          <div key={i} className="flex-1 border rounded-lg p-4 flex flex-col items-center space-y-2">
            <h3 className="font-medium">{t}</h3>
            <p className="text-3xl font-bold">{teamScores[i]}</p>
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
          <table className="min-w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Category</th>
                <th className="px-4 py-2 border-b">Points</th>
                <th className="px-4 py-2 border-b">Question</th>
              </tr>
            </thead>
            <tbody>
              {history.map((c, idx) => (
                <tr key={`${keyFor(c)}-${idx}`}>
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
