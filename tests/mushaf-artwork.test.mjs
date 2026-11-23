import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
const base = new URL('../public/mushaf/dar-al-marefa/', import.meta.url);
const index = JSON.parse(await readFile(new URL('../src/assets/mushaf-pages.json', import.meta.url), 'utf8'));
const markerBounds = JSON.parse(await readFile(new URL('../src/assets/mushaf-marker-bounds.json', import.meta.url), 'utf8'));
const bannerBounds = JSON.parse(await readFile(new URL('../src/assets/mushaf-banner-bounds.json', import.meta.url), 'utf8'));
const chapters = JSON.parse(await readFile(new URL('../src/assets/chapters.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('../src/apps/mushaf/selection.ts', import.meta.url), 'utf8');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { imagePoint, nearestAyah } = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));

test('all 604 page images and coordinate regions match and cover every ayah', async () => {
 const firstPage = new Map();
 const markersByAyah = new Map(index.flatMap((pages, s) => pages.map((_, a) => `${s + 1}:${a + 1}`)).map((key, i) => [key, markerBounds[i]]));
 const checkedMarkers = new Set();
 assert.equal(bannerBounds.length, 604);
 assert.equal(bannerBounds.slice(2).flat().length, 112);
 for (let page = 1; page <= 604; page++) {
  const [png, json] = await Promise.all([readFile(new URL(page + '.png', base)), readFile(new URL(page + '.json', base), 'utf8')]);
  const data = JSON.parse(json);
  assert.equal(png.readUInt32BE(16), data.width);
  assert.equal(png.readUInt32BE(20), data.height);
  assert.ok(data.regions.length);
  for (const [left, top, right, bottom] of bannerBounds[page - 1]) {
   assert.ok(left >= 0 && right > left && right <= data.width && top >= 0 && bottom > top && bottom <= data.height, page);
  }
  for (const [surah, ayah, line, x1, y1, x2, y2] of data.regions) {
   assert.ok(line >= 1 && line <= 15);
   assert.ok(x1 >= 0 && x2 > x1 && x2 <= data.width && y1 >= 0 && y2 > y1 && y2 <= data.height);
   const key = surah + ':' + ayah;
   if (!firstPage.has(key)) firstPage.set(key, page);
  }
  for (const [surah, ayah] of data.endings) {
   const key = surah + ':' + ayah;
   const [left, top, right, bottom] = markersByAyah.get(key);
   assert.ok(left >= 0 && right <= data.width && top >= 0 && bottom <= data.height, key);
   assert.ok(right - left >= 55 && bottom - top >= 80, key);
   assert.ok(!checkedMarkers.has(key), key);
   checkedMarkers.add(key);
  }
 }
 assert.equal(checkedMarkers.size, markerBounds.length);
 assert.equal(firstPage.size, 6236);
 for (const chapter of chapters) {
  assert.equal(index[chapter.id - 1].length, chapter.verses);
  for (let ayah = 1; ayah <= chapter.verses; ayah++) assert.equal(index[chapter.id - 1][ayah - 1], firstPage.get(chapter.id + ':' + ayah));
 }
 assert.equal(index[1][254], 42);
 assert.equal(index[113][5], 604);
});

test('selection stays aligned with letterboxed artwork in phone and landscape viewports', async () => {
 const data = JSON.parse(await readFile(new URL('3.json', base), 'utf8'));
 const [surah, ayah, , x1, y1, x2, y2] = data.regions.find(r => r[0] === 2 && r[1] === 6);
 const boxes = data.regions.map(([s, a, , l, t, r, b]) => ({key: s + ':' + a, left:l, top:t, right:r, bottom:b}));
 for (const bounds of [{left: 4, top: 44, width: 382, height: 680}, {left: 10, top:44, width:880, height:300}]) {
  const scale = Math.min(bounds.width/data.width, bounds.height/data.height);
  const x = bounds.left + (bounds.width-data.width*scale)/2 + (x1+x2)/2*scale;
  const y = bounds.top + (bounds.height-data.height*scale)/2 + (y1+y2)/2*scale;
  const point = imagePoint(x,y,bounds,data.width,data.height);
  assert.equal(nearestAyah(point.x,point.y,boxes), surah + ':' + ayah);
  assert.ok(Math.abs(point.x-(x1+x2)/2)<0.001);
 }
});
