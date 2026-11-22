import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function load(path) { const source = await readFile(new URL(path, import.meta.url), 'utf8'); const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText; return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64')); }
const { parseAyahReference } = await load('../src/lib/ayahReference.ts');
const { nearestAyah } = await load('../src/apps/mushaf/selection.ts');
const chapters = JSON.parse(await readFile(new URL('../src/assets/chapters.json', import.meta.url), 'utf8'));
const counts = chapters.map(c => c.verses);
test('ayah search validates references including Arabic digits and whitespace', () => {
 assert.equal(parseAyahReference('2:255', counts), '2:255');
 assert.equal(parseAyahReference(' ٢ : ٢٥٥ ', counts), '2:255');
 assert.equal(parseAyahReference('114:6', counts), '114:6');
 for (const query of ['0:1','115:1','1:8','2:0','2:287','2:','Baqarah','2:1:1']) assert.equal(parseAyahReference(query, counts), null);
});
test('selection resolves the nearest ayah in a line gap and at verse boundaries', () => {
 const boxes = [{ key: '2:1', left: 150, right: 250, top: 0, bottom: 40 }, { key: '2:2', left: 30, right: 140, top: 0, bottom: 40 }, { key: '2:3', left: 30, right: 250, top: 50, bottom: 90 }];
 assert.equal(nearestAyah(200, 15, boxes), '2:1');
 assert.equal(nearestAyah(50, 15, boxes), '2:2');
 assert.equal(nearestAyah(200, 43, boxes), '2:1');
 assert.equal(nearestAyah(200, 48, boxes), '2:3');
 assert.equal(nearestAyah(145, 20, boxes), '2:1');
 assert.equal(nearestAyah(0, 0, []), null);
});
