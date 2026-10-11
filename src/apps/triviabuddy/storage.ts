import type { Clue } from './types';
export interface Game {
  id: string;
  name: string;
  teams: string[];
  categories: string[];
  board: Record<string, Record<number, Clue>>;
  progress?: { askedClues: string[]; teamScores: number[]; history: Clue[] };
}
/** A damaged or inaccessible save should not prevent other games from opening. */
export function loadGame(id: string): Game | null {
  try {
    const raw = localStorage.getItem('trivia-game-' + id);
    if (!raw) return null;
    const game: Game = JSON.parse(raw);
    if (game.id !== id || typeof game.name !== 'string' || !Array.isArray(game.teams) || !Array.isArray(game.categories) || !game.board) return null;
    if (!game.teams.every(team => typeof team === 'string') || !game.categories.every(cat => typeof cat === 'string' && [100, 200, 300, 400, 500].every(points => {
      const clue = game.board[cat]?.[points];
      return clue && typeof clue.question === 'string' && typeof clue.answer === 'string';
    }))) return null;
    if (game.progress && (!Array.isArray(game.progress.askedClues) || !Array.isArray(game.progress.history) || !Array.isArray(game.progress.teamScores) || game.progress.teamScores.length !== game.teams.length || !game.progress.teamScores.every(Number.isFinite))) return null;
    return game;
  } catch { return null; }
}
export function listGames(): Game[] {
  try {
    return Object.keys(localStorage).filter(key => key.startsWith('trivia-game-')).flatMap(key => {
      const game = loadGame(key.slice('trivia-game-'.length));
      return game ? [game] : [];
    });
  } catch { return []; }
}
export function saveGame(game: Game): boolean {
  try { localStorage.setItem('trivia-game-' + game.id, JSON.stringify(game)); return true; }
  catch { return false; }
}
