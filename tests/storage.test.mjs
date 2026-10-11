import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/apps/triviabuddy/storage.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { saveGame, loadGame, listGames } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
let values;
beforeEach(() => {
  values = {};
  globalThis.localStorage = new Proxy({
    getItem: key => values[key] ?? null,
    setItem: (key, value) => { values[key] = value; },
  }, { ownKeys: () => Object.keys(values), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) });
});
function fixture() {
  return { id: 'saved', name: 'Practice', teams: ['Team 1', 'Team 2'], categories: ['Example'], board: { Example: Object.fromEntries([100, 200, 300, 400, 500].map(points => [points, { id: String(points), category: 'Example', points, question: 'Question', answer: 'Answer' }])) } };
}
test('round-trips existing game keys and latest progress', () => {
  const game = fixture();
  game.progress = { askedClues: ['Example-100'], teamScores: [100, 0], history: [game.board.Example[100]] };
  assert.equal(saveGame(game), true);
  assert.deepEqual(loadGame(game.id), game);
  assert.deepEqual(listGames(), [game]);
});
test('a corrupt save does not hide valid games', () => {
  saveGame(fixture());
  values['trivia-game-corrupt'] = '{';
  values['trivia-game-incomplete'] = JSON.stringify({ ...fixture(), id: 'incomplete', board: {} });
  assert.equal(loadGame('corrupt'), null);
  assert.equal(loadGame('incomplete'), null);
  assert.equal(listGames().length, 1);
});
test('blocked storage returns failure without crashing', () => {
  globalThis.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('full'); } };
  assert.equal(saveGame(fixture()), false);
  assert.equal(loadGame('saved'), null);
});
test('invalid score data is rejected', () => {
  const game = fixture();
  game.progress = { askedClues: [], history: [], teamScores: ['bad', 0] };
  values['trivia-game-saved'] = JSON.stringify(game);
  assert.equal(loadGame('saved'), null);
});
