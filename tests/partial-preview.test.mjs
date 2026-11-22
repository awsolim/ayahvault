import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const source = await readFile(new URL('../src/apps/memobuddy/previewText.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { previewSegments } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const quran = JSON.parse(await readFile(new URL('../src/assets/quran.json', import.meta.url), 'utf8'));
test('full and partial preview preserve all Quran text and whitespace without ellipses', () => {
 for (const verse of quran) {
  const full = previewSegments(verse.text, Infinity);
  const partial = previewSegments(verse.text, 1);
  assert.equal(full.map(x => x.text).join(''), verse.text);
  assert.deepEqual(partial.map(x => x.text), full.map(x => x.text));
  assert.equal(partial.filter(x => x.isWord && !x.hidden).length, 1);
 }
});
test('increasing visible count changes only visibility, including repeated whitespace', () => {
 const text = 'ألف  باء\nجيم';
 const one = previewSegments(text, 1), two = previewSegments(text, 2);
 assert.equal(one.map(x => x.text).join(''), text);
 assert.deepEqual(one.map(x => x.text), two.map(x => x.text));
 assert.equal(one.filter(x => x.hidden).length, 2);
 assert.equal(two.filter(x => x.hidden).length, 1);
 assert.equal(previewSegments(text, 100).some(x => x.hidden), false);
});

test('pause signs are hidden in partial mode and never consume the word count', () => {
 const text = 'وَمَا ٱلْحَيَوٰةُ ۖ وَلَلدَّارُ ۗ';
 const full = previewSegments(text, Infinity), partial = previewSegments(text, 2);
 assert.equal(partial.map(x => x.text).join(''), text);
 assert.deepEqual(full.map(x => x.text), partial.map(x => x.text));
 assert.equal(partial.filter(x => x.isWord && !x.hidden).length, 2);
 assert.equal(partial.filter(x => /[\u06d6-\u06dc]/u.test(x.text)).every(x => x.hidden && !x.isWord), true);
 assert.equal(full.every(x => !x.hidden), true);
 const three = previewSegments(text, 3);
 assert.equal(three.filter(x => x.isWord && !x.hidden).length, 3);
 assert.equal(three.filter(x => /[\u06d6-\u06dc]/u.test(x.text)).every(x => x.hidden), true);
});
