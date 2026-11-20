import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
async function load(path) {
 const source = await readFile(new URL(path, import.meta.url), 'utf8');
 const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
 return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const { pageOffset, pageAtOffset } = await load('../src/apps/mushaf/paging.ts');
const { isValidSelectionRange } = await load('../src/apps/memobuddy/hooks/rangeValidation.ts');
test('Al-Fatiha is rightmost, An-Nas leftmost, and every page round-trips on phone and desktop widths', () => {
 for (const width of [320, 390, 768, 1440]) {
  assert.equal(pageOffset(604, width), 0);
  assert.equal(pageOffset(1, width), 603 * width);
  for (let page = 1; page <= 604; page++) assert.equal(pageAtOffset(pageOffset(page, width), width), page);
  assert.equal(pageAtOffset(-100, width), 604);
  assert.equal(pageAtOffset(99999999, width), 1);
 }
});
test('empty and cleared selections cannot generate from a fallback range', () => {
 for (const mode of ['surah', 'juz']) {
  for (const value of ['', ' ', '0', '-1', '1.5', 'NaN', '1x']) {
   assert.equal(isValidSelectionRange(mode, value, '1'), false);
   assert.equal(isValidSelectionRange(mode, '1', value), false);
  }
 }
});
test('selection limits are enforced, including ranges entered in reverse', () => {
 assert.equal(isValidSelectionRange('juz', '30', '1'), true);
 assert.equal(isValidSelectionRange('juz', '31', '1'), false);
 assert.equal(isValidSelectionRange('surah', '114', '1'), true);
 assert.equal(isValidSelectionRange('surah', '1', '115'), false);
});
