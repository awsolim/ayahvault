// src/apps/triviabuddy/pages/GameSetup.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import Spinner from '../../../components/ui/Spinner';
import type { Clue } from '../types';

type Tab = 'play' | 'create' | 'yourgames';

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

interface ManualQA { question: string; answer: string }
interface ManualCategory { name: string; qas: ManualQA[] }

/* ----------------- NEW: sensible defaults ----------------- */
const DEFAULT_GAME_NAME = 'Untitled Game'; // NEW: used when game name left blank
const DEFAULT_TEAM_NAME = (i: number) => `Team ${i + 1}`; // NEW: fallback per team

export default function GameSetup() {
  const navigate = useNavigate();

  // --- Tabs & flow ---
  const [activeTab, setActiveTab] = useState<Tab>('play');
  const [teamSetupGame, setTeamSetupGame] = useState<Game | null>(null);

  // --- Shared form state ---
  const [gameName, setGameName] = useState(''); // CHANGED: allow blank; we’ll fallback on submit
  const [teams, setTeams] = useState<string[]>(['', '']); // CHANGED: blanks allowed; placeholders + fallback

  // --- Play‐tab state ---
  const [allCats, setAllCats] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submittingPlay, setSubmittingPlay] = useState(false);

  // --- Create‐tab state ---
  const [manualCategories, setManualCategories] = useState<ManualCategory[]>(
    Array.from({ length: 3 }, () => ({
      name: '',
      qas: Array.from({ length: 5 }, () => ({ question: '', answer: '' })),
    }))
  );
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // --- Your Games state (with resume flag) ---
  const [savedGames, setSavedGames] = useState<(Game & { canResume: boolean })[]>([]);

  // --- Effects ---

  // Fetch Supabase categories on Play tab
  useEffect(() => {
    if (activeTab !== 'play') return;
    (async () => {
      try {
        const { data } = await supabase.from('triviabuddy').select('category');
        if (data) setAllCats(Array.from(new Set(data.map(r => r.category))));
      } finally {
        setLoadingCats(false);
      }
    })();
  }, [activeTab]);

  // Load saved games and mark resumable
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('trivia-game-'));
    const games = keys
      .map(k => {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        const g: Game = JSON.parse(raw);
        return {
          ...g,
          canResume: Array.isArray(g.progress?.askedClues) && g.progress!.askedClues.length > 0,
        };
      })
      .filter((g): g is Game & { canResume: boolean } => g !== null);
    setSavedGames(games);
  }, []);

  // --- Helpers (NEW): apply default fallbacks cleanly ---
  function withDefaultGameName(name: string) {
    return name.trim() || DEFAULT_GAME_NAME; // NEW
  }
  function withDefaultTeamNames(names: string[]) {
    // NEW: ensure at least two teams; fill blanks with “Team 1/2/...”
    const atLeastTwo = names.length >= 2 ? names : ['', ''];
    return atLeastTwo.map((n, i) => n.trim() || DEFAULT_TEAM_NAME(i));
  }

  // --- Handlers ---

  // Start a new Supabase-backed game (Play tab)
  const handlePlaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPlay(true);

    const gameId = crypto.randomUUID();
    const board: Record<string, Record<number, Clue>> = {};

    for (const cat of selectedCats) {
      board[cat] = {};
      for (const pts of [100, 200, 300, 400, 500]) {
        const { data } = await supabase
          .from('triviabuddy')
          .select('*')
          .eq('include', true) // NOTE: trusted filter, only fetch approved rows
          .eq('category', cat)
          .eq('points', pts);
        if (data?.length) {
          board[cat][pts] = data[Math.floor(Math.random() * data.length)];
        }
      }
    }

    // NEW: apply default fallbacks for game name and any blank team names
    const finalName = withDefaultGameName(gameName);      // NEW
    const finalTeams = withDefaultTeamNames(teams);       // NEW

    const game: Game = { id: gameId, name: finalName, teams: finalTeams, categories: selectedCats, board };
    localStorage.setItem(`trivia-game-${gameId}`, JSON.stringify(game));
    navigate(`/triviabuddy/game/${gameId}`);
  };

  // Create‐tab helpers
  const addCategory = () => {
    if (manualCategories.length < 6) {
      setManualCategories(prev => [
        ...prev,
        { name: '', qas: Array.from({ length: 5 }, () => ({ question: '', answer: '' })) },
      ]);
    }
  };
  const removeCategory = (i: number) => {
    if (manualCategories.length > 3) {
      setManualCategories(prev => prev.filter((_, idx) => idx !== i));
    }
  };
  const updateCategoryName = (i: number, name: string) => {
    setManualCategories(prev => prev.map((c, idx) => (idx === i ? { ...c, name } : c)));
  };
  const updateQA = (ci: number, qi: number, field: keyof ManualQA, val: string) => {
    setManualCategories(prev =>
      prev.map((c, idx) => {
        if (idx !== ci) return c;
        const qas = c.qas.map((qa, j) => (j === qi ? { ...qa, [field]: val } : qa));
        return { ...c, qas };
      })
    );
  };

  // Create a manual game
  const handleCreate = async () => {
    setSubmittingCreate(true);

    const gameId = crypto.randomUUID();
    const board: Record<string, Record<number, Clue>> = {};

    manualCategories.forEach(cat => {
      board[cat.name] = {};
      [100, 200, 300, 400, 500].forEach((pts, qi) => {
        board[cat.name][pts] = {
          id: crypto.randomUUID(),
          category: cat.name,
          points: pts,
          question: cat.qas[qi].question,
          answer: cat.qas[qi].answer,
        };
      });
    });

    // NEW: Name fallback; teams intentionally removed for Create tab flow
    const finalName = withDefaultGameName(gameName); // NEW

    const game: Game = {
      id: gameId,
      name: finalName,
      teams: [], // NEW: no teams at creation; user will input in "Your Games"
      categories: manualCategories.map(c => c.name),
      board,
    };
    localStorage.setItem(`trivia-game-${gameId}`, JSON.stringify(game));
    setSavedGames(prev => [...prev, { ...game, canResume: false }]); // unchanged
    setSubmittingCreate(false);
    setActiveTab('yourgames'); // unchanged: jump to “Your Games” after creation
  };

  // Handle clicking Play/Resume in Your Games
  const playSavedGame = (g: Game & { canResume: boolean }) => {
    if (g.canResume) {
      navigate(`/triviabuddy/game/${g.id}`);
    } else {
      setTeamSetupGame(g);
      // NEW: if there are no stored teams yet, present two blank inputs with placeholders
      setTeams(g.teams.length ? g.teams : ['', '']); // NEW
    }
  };

  // Delete a saved game
  const deleteGame = (id: string) => {
    localStorage.removeItem(`trivia-game-${id}`);
    setSavedGames(prev => prev.filter(g => g.id !== id));
  };

  // Finalize teams then start a newly created or resumed‐without‐progress game
  const finalizeTeamsForSaved = () => {
    if (!teamSetupGame) return;
    const raw = localStorage.getItem(`trivia-game-${teamSetupGame.id}`);
    if (!raw) return;
    const stored: Game = JSON.parse(raw);

    // NEW: apply team name fallbacks before saving
    stored.teams = withDefaultTeamNames(teams); // NEW

    localStorage.setItem(`trivia-game-${stored.id}`, JSON.stringify(stored));
    navigate(`/triviabuddy/game/${stored.id}`);
  };

  /* ----------------- Renderers ----------------- */

  const renderPlayTab = () => {
    if (loadingCats) {
      return <div className="flex justify-center py-10"><Spinner /></div>;
    }
    const available = allCats.filter(c => !selectedCats.includes(c));

    return (
      <form onSubmit={handlePlaySubmit} className="space-y-6">
        {/* Game Name */}
        <div>
          <label className="block font-medium">Game Name (optional)</label> {/* CHANGED: wording */}
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            maxLength={40}                                     /* CHANGED: keep a soft cap, no min/required */
            placeholder={DEFAULT_GAME_NAME}                    /* NEW: placeholder */
            className="mt-1 w-full border rounded-lg px-3 py-2"
          />
        </div>

        {/* Teams */}
        <div>
          <h2 className="font-medium mb-2">Teams (2–5)</h2>
          {teams.map((t, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <label className="w-20">Team {i + 1}:</label>
              <input
                value={t}
                onChange={e => {
                  const c = [...teams]; c[i] = e.target.value; setTeams(c);
                }}
                placeholder={DEFAULT_TEAM_NAME(i)}             /* NEW: placeholder */
                className="flex-1 border rounded-lg px-2 py-1"
              />
              {teams.length > 2 && (
                <button
                  type="button"
                  onClick={() => setTeams(teams.filter((_, idx) => idx !== i))}
                  className="text-red-500 font-bold"
                >−</button>
              )}
            </div>
          ))}
          {teams.length < 5 && (
            <button
              type="button"
              onClick={() => setTeams([...teams, ''])}
              className="text-blue-600 font-medium"
            >+ Add Team</button>
          )}
        </div>

        {/* Category Picker */}
        <div>
          <h2 className="font-medium mb-2">Choose 3–6 Categories</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Available */}
            <div>
              {available.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    if (selectedCats.length < 6) {
                      setSelectedCats(prev => [...prev, cat]);
                    }
                  }}
                  /* CHANGED: lighter, shorter, modern look */
                  className="flex justify-between items-center w-full border border-red-100 rounded-lg bg-red-50 hover:bg-blue-50 px-3 py-2 mb-2 text-sm shadow-sm transition"
                >
                  <span>{cat}</span>
                  {selectedCats.length < 6 && <span className="text-lg font-bold">+</span>}
                </button>
              ))}
            </div>
            {/* Selected */}
            <div>
              {selectedCats.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() =>
                    setSelectedCats(prev => prev.filter(c => c !== cat))
                  }
                  /* CHANGED: lighter, shorter, modern look */
                  className="flex justify-between items-center w-full border border-green-100 rounded-lg bg-green-50 hover:bg-blue-50 px-3 py-2 mb-2 text-sm shadow-sm transition"
                >
                  <span>{cat}</span>
                  <span className="text-lg font-bold">−</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            submittingPlay ||
            selectedCats.length < 3 /* CHANGED: allow blank team names; we’ll default */
          }
          className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {submittingPlay && <Spinner />}
          <span className="ml-2">Play a Game</span>
        </button>
      </form>
    );
  };

  const renderCreateTab = () => (
    <div className="space-y-6">
      {/* Game Name */}
      <div>
        <label className="block font-medium">Game Name (optional)</label> {/* CHANGED: wording */}
        <input
          type="text"
          value={gameName}
          onChange={e => setGameName(e.target.value)}
          maxLength={40}                                     /* CHANGED: no min/required */
          placeholder={DEFAULT_GAME_NAME}                    /* NEW: placeholder */
          className="mt-1 w-full border rounded-lg px-3 py-2"
        />
      </div>

      {/* CHANGED: removed team inputs from Create tab per request */}

      {/* Manual Categories & Q/A */}
      <div>
        <h2 className="font-medium mb-2">Categories & Questions (3–6)</h2>
        {manualCategories.map((cat, ci) => (
          <div key={ci} className="border p-4 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <input
                type="text"
                placeholder={`Category ${ci + 1}`}
                value={cat.name}
                onChange={e => updateCategoryName(ci, e.target.value)}
                className="border rounded-lg px-2 py-1 flex-1"
                required
              />
              {manualCategories.length > 3 && (
                <button
                  type="button"
                  onClick={() => removeCategory(ci)}
                  className="text-red-600 font-bold ml-2"
                >Remove</button>
              )}
            </div>
            {cat.qas.map((qa, qi) => (
              <div key={qi} className="grid grid-cols-12 gap-2">
                <span className="col-span-1 font-bold">
                  {[100, 200, 300, 400, 500][qi]}
                </span>
                <input
                  type="text"
                  placeholder="Question"
                  value={qa.question}
                  onChange={e => updateQA(ci, qi, 'question', e.target.value)}
                  className="col-span-5 border rounded-lg px-2 py-1"
                  required
                />
                <input
                  type="text"
                  placeholder="Answer"
                  value={qa.answer}
                  onChange={e => updateQA(ci, qi, 'answer', e.target.value)}
                  className="col-span-6 border rounded-lg px-2 py-1"
                  required
                />
              </div>
            ))}
          </div>
        ))}
        {manualCategories.length < 6 && (
          <button
            type="button"
            onClick={addCategory}
            className="text-blue-600 font-medium"
          >+ Add Category</button>
        )}
      </div>

      {/* Create Game */}
      <button
        onClick={handleCreate}
        disabled={
          submittingCreate ||
          manualCategories.some(cat =>
            !cat.name.trim() ||
            cat.qas.some(qa => !qa.question.trim() || !qa.answer.trim())
          )
        }
        className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {submittingCreate && <Spinner />}
        <span className="ml-2">Create Game</span>
      </button>
    </div>
  );

  const renderYourGames = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Saved Games</h2>
      <ul className="space-y-3">
        {savedGames.map(g => (
          <li
            key={g.id}
            className="border rounded-lg p-3 flex justify-between items-center"
          >
            <div>
              <strong>{g.name}</strong>
              <div className="text-sm text-gray-500">
                {g.categories.join(', ')}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
  onClick={() => playSavedGame(g)}
  className="w-28 text-center bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700" // NEW: w-28 makes Play/Resume same width
>
  {g.canResume ? 'Resume' : 'Play'}
</button>
              <button
                onClick={() => deleteGame(g.id)}
                className="text-red-600 hover:text-red-800"
                aria-label="Delete game"
                title="Delete game"
              >
                {/* simple trash icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M6 2a1 1 0 00-.894.553L3 6H2a1 1 0 100 2h16a1 1 0 100-2h-1l-2.106-3.447A1 1 0 0014 2H6zM4 8v10a2 2 0 002 2h8a2 2 0 002-2V8H4z" />
                </svg>
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );

  const renderTeamSetupForSaved = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">
        Select Teams for "{teamSetupGame?.name}"
      </h2>
      {teams.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <label className="w-20">Team {i + 1}:</label>
          <input
            value={t}
            onChange={e => {
              const c = [...teams]; c[i] = e.target.value; setTeams(c);
            }}
            placeholder={DEFAULT_TEAM_NAME(i)}               
            className="flex-1 border rounded-lg px-2 py-1"
          />
        </div>
      ))}
      {teams.length < 5 && (
        <button
          onClick={() => setTeams([...teams, ''])}
          className="text-blue-600"
        >+ Add Team</button>
      )}
      <button
        onClick={finalizeTeamsForSaved}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mt-4 ml-4"
      >
        Start Game
      </button>
    </div>
  );

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      {/* NEW: Big blue page title above tabs */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-center text-blue-700">
        TriviaBuddy — Play or Create a Game
      </h1>

      {/* CHANGED: “tab” style headers with active blue bg/white text */}
      <div className="flex gap-2 border-b">
        {(['play','create','yourgames'] as Tab[]).map(tab => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setTeamSetupGame(null); }}
              className={[
                "px-4 py-2 rounded-t-lg text-sm font-semibold transition",
                active
                  ? "bg-blue-600 text-white"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700"
              ].join(' ')}
            >
              {tab === 'play' ? 'Play a Game' : tab === 'create' ? 'Create a Game' : 'Your Games'}
            </button>
          );
        })}
      </div>

      {teamSetupGame
        ? renderTeamSetupForSaved()
        : activeTab === 'play'
        ? renderPlayTab()
        : activeTab === 'yourgames'
        ? renderYourGames()
        : renderCreateTab()}
    </main>
  );
}
