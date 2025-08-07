import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import Spinner from '../../../components/ui/Spinner';
import type { Clue } from '../types';

export default function GameSetup() {
  const navigate = useNavigate();

  // Form state
  const [gameName, setGameName] = useState('');
  const [teams, setTeams] = useState<string[]>(['', '']);
  const [allCats, setAllCats] = useState<string[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // fetch distinct categories
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('triviabuddy')
          .select('category');
        if (data) {
          setAllCats(Array.from(new Set(data.map(r => r.category))));
        }
      } finally {
        setLoadingCats(false);
      }
    })();
  }, []);

  if (loadingCats) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  // Teams handlers
  const addTeam = () => teams.length < 5 && setTeams([...teams, '']);
  const updateTeam = (i: number, v: string) => {
    const copy = [...teams];
    copy[i] = v;
    setTeams(copy);
  };
  const removeTeam = (i: number) =>
    teams.length > 2 && setTeams(teams.filter((_, idx) => idx !== i));

  // Categories handlers
  const selectCat = (cat: string) =>
    selectedCats.length < 6 && setSelectedCats([...selectedCats, cat]);
  const unselectCat = (cat: string) =>
    setSelectedCats(selectedCats.filter(c => c !== cat));

  // Submit logic same as before...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const gameId = crypto.randomUUID();
    const board: Record<string, Record<number, Clue>> = {};
    for (const cat of selectedCats) {
      board[cat] = {};
      for (const pts of [100, 200, 300, 400, 500]) {
        const { data } = await supabase
          .from('triviabuddy')
          .select('*')
          .eq('category', cat)
          .eq('points', pts);
        if (data?.length) {
          board[cat][pts] = data[Math.floor(Math.random() * data.length)];
        }
      }
    }
    const game = { id: gameId, name: gameName, teams, categories: selectedCats, board };
    localStorage.setItem(`trivia-game-${gameId}`, JSON.stringify(game));
    navigate(`/triviabuddy/game/${gameId}`);
  };

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Create Trivia Game</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Game Name */}
        <div>
          <label className="block font-medium">Game Name (3–20 chars)</label>
          <input
            type="text"
            value={gameName}
            onChange={e => setGameName(e.target.value)}
            minLength={3}
            maxLength={20}
            required
            className="mt-1 w-full border rounded px-3 py-2"
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
                onChange={e => updateTeam(i, e.target.value)}
                required
                className="flex-1 border rounded px-2 py-1"
              />
              {teams.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeTeam(i)}
                  className="text-red-500 font-bold"
                >
                  −
                </button>
              )}
            </div>
          ))}
          {teams.length < 5 && (
            <button
              type="button"
              onClick={addTeam}
              className="text-blue-600 font-medium"
            >
              + Add Team
            </button>
          )}
        </div>

        {/* Categories */}
        <div>
          <h2 className="font-medium mb-2">Categories (3–6)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-1">Available</h3>
              <ul className="space-y-1">
                {allCats
                  .filter(c => !selectedCats.includes(c))
                  .map(cat => (
                    <li
                      key={cat}
                      className="flex justify-between items-center bg-gray-50 rounded px-2 py-1"
                    >
                      <span>{cat}</span>
                      {selectedCats.length < 6 && (
                        <button
                          type="button"
                          onClick={() => selectCat(cat)}
                          className="ml-2 text-green-700 font-bold hover:bg-green-100 px-2 py-0.5 rounded"
                        >
                          +
                        </button>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-1">Selected</h3>
              <ul className="space-y-1">
                {selectedCats.map(cat => (
                  <li
                    key={cat}
                    className="flex justify-between items-center bg-green-50 rounded px-2 py-1"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => unselectCat(cat)}
                      className="ml-2 text-red-700 font-bold hover:bg-red-100 px-2 py-0.5 rounded"
                    >
                      −
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={
            submitting ||
            !gameName.trim() ||
            teams.some(t => !t.trim()) ||
            selectedCats.length < 3
          }
          className="inline-flex items-center bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 disabled:opacity-20 transition"
        >
          {submitting && <Spinner />}
          <span className="ml-2">Create Game</span>
        </button>
      </form>
    </main>
  );
}
