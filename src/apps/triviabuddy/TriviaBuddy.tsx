// src/apps/triviabuddy/TriviaBuddy.tsx
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

  /* small “bump” animation flag for a team whose score just changed */
  const [bumpedIdx, setBumpedIdx] = useState<number | null>(null);

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

  // Persist asked set (optional)
  useEffect(() => {
    if (game) {
      localStorage.setItem(
        `trivia-asked-${game.id}`,
        JSON.stringify(Array.from(askedClues))
      );
    }
  }, [askedClues, game]);

  // Autosave full progress on unmount
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

  /* update score AND briefly mark which team to “bump” */
  const adjustScore = (i: number, delta: number) => {
    setTeamScores(prev => {
      const next = [...prev];
      next[i] += delta;
      return next;
    });
    setBumpedIdx(i);
    setTimeout(() => setBumpedIdx(null), 180);
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

      {/* ============== Jeopardy Grid ============== */}
      <div className="w-full max-w-6xl mx-auto mb-8">
        <div className="rounded-3xl bg-white/70 backdrop-blur-sm ring-1 ring-black/5 p-5">
          <div
            className="grid gap-4 justify-items-center"
            style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(8rem, 1fr))` }}
          >
            {categories.map(cat => (
              <div
                key={cat}
                className="w-full text-center font-semibold uppercase tracking-wide text-blue-900/90
                           bg-blue-50 ring-1 ring-blue-200 rounded-xl py-2"
              >
                {cat}
              </div>
            ))}

            {tiers.flatMap(pts =>
              categories.map(cat => {
                const clue = board[cat][pts];
                const key = keyFor(clue);
                const asked = askedClues.has(key);

                return asked ? (
                  <div
                    key={key}
                    className="w-full h-20 rounded-xl bg-blue-200/70 ring-1 ring-blue-200"
                  />
                ) : (
                  <button
                    key={key}
                    onClick={() => { setSelectedClue(clue); openModal(); }}
                    className="w-full h-20 rounded-xl
                               bg-gradient-to-b from-indigo-500 to-blue-600
                               text-white font-extrabold text-lg
                               shadow-[0_8px_0_rgba(0,0,0,0.18)]
                               ring-1 ring-white/20
                               hover:translate-y-[-2px] active:translate-y-[1px]
                               transition-transform"
                  >
                    {pts}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
      {/* ======================= /Jeopardy Grid ======================= */}

      {/* =================== Team Scores (game-show scoreboard) =================== */}
      {/* CHANGE 1: widen container & allow 5 cols on very wide screens; stretch items to column width */}
      {/* Team Scores (force 5-up on laptops/desktops) */}
<div
  className="
    w-full max-w-screen-2xl mx-auto             /* container stays centered */
    flex flex-wrap justify-center items-start    /* NEW: center rows & allow wrap */
    gap-5                                        /* spacing between cards */
    mb-12
  "
>
  {teams.map((rawName, i) => {
    const displayName = rawName?.trim() || `Team ${i + 1}`;

    return (
      <div
        key={i}
        className="
          relative                                  /* NEW: for the ring overlay */
          w-[min(10rem,100%)]                       /* NEW: consistent card width, still responsive */
          rounded-2xl p-4 text-white
          bg-gradient-to-b from-[#0b1e4b] via-[#0a205e] to-[#0a1540]
          shadow-xl ring-white/10
        "
      >
        <div className="flex items-center justify-center">
          <h3 className="text-base font-semibold tracking-wide text-center">
            {displayName}
          </h3>
        </div>

        <div
          className={[
            "mt-1 text-center text-5xl font-extrabold font-mono tabular-nums drop-shadow",
            "transition-transform duration-200",
            bumpedIdx === i ? "scale-105" : "",
          ].join(" ")}
        >
          {teamScores[i]}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            onClick={() => adjustScore(i, 100)}
            className="py-2 rounded-xl font-bold bg-emerald-500/90 hover:bg-emerald-500
                       active:translate-y-[1px] shadow-[0_6px_0_rgba(0,0,0,0.2)] transition"
          >
            +100
          </button>
          <button
            onClick={() => adjustScore(i, -100)}
            className="py-2 rounded-xl font-bold bg-rose-500/90 hover:bg-rose-500
                       active:translate-y-[1px] shadow-[0_6px_0_rgba(0,0,0,0.2)] transition"
          >
            −100
          </button>
        </div>

        {/* ring overlay needs a positioned parent (we set `relative` above) */}
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
      </div>
    );
  })}
</div>

      {/* =================== /Team Scores =================== */}

      {/* History */}
      <section className="w-full max-w-4xl mx-auto">
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
