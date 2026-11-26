import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
}
const model = await load("../src/apps/memobuddy/practiceModel.ts");
const artwork = await load("../src/apps/mushaf/artwork.ts");
const {previewSegments}=await load('../src/apps/memobuddy/previewText.ts');
const quran = JSON.parse(
  await readFile(new URL("../src/assets/quran.json", import.meta.url), "utf8"),
);
const keys = quran.map(model.verseKey);
const index = new Map(keys.map((key, i) => [key, i]));
const position = (key) => index.get(key) ?? -1;
test("visibility anchors to the question and preserves cumulative reveals across chapters", () => {
  const progress = model.startPractice("8:52", "test");
  assert.ok(model.visibleInPractice("8:51", progress, "following", position));
  assert.equal(
    model.visibleInPractice("8:51", progress, "others", position),
    false,
  );
  assert.ok(model.visibleInPractice("8:52", progress, "others", position));
  assert.equal(
    model.visibleInPractice("8:53", progress, "following", position),
    false,
  );
  const next = { ...progress, through: "8:54" };
  assert.ok(model.visibleInPractice("8:53", next, "others", position));
  assert.equal(
    model.visibleInPractice("8:55", next, "others", position),
    false,
  );
  assert.ok(
    model.visibleInPractice(
      "114:6",
      { ...next, showAll: true },
      "others",
      position,
    ),
  );
  assert.ok(
    model.visibleInPractice(
      "114:6",
      { ...next, active: false },
      "others",
      position,
    ),
  );
  const chapterBoundary = {
    ...model.startPractice("1:7", "boundary"),
    through: "2:1",
  };
  assert.ok(
    model.visibleInPractice("2:1", chapterBoundary, "others", position),
  );
});
test("continuations end at the first gap and respect exact, reversed, excluded, and empty ranges", () => {
  const base = {
    mode: "surah",
    rangeStart: "8",
    rangeEnd: "9",
    useMultiRange: true,
    customConfig: model.defaultCustomConfig,
  };
  const pool = model.selectVersePool(quran, base);
  assert.equal(model.continuationEnd("8:52", pool, keys), "9:129");
  const reversed = model.selectVersePool(quran, {
    ...base,
    rangeStart: "9",
    rangeEnd: "8",
  });
  assert.deepEqual(reversed, pool);
  const disjoint = quran.filter((v) =>
    ["8:52", "8:54"].includes(model.verseKey(v)),
  );
  assert.equal(model.continuationEnd("8:52", disjoint, keys), "8:52");
  assert.throws(() =>
    model.selectVersePool(quran, { ...base, rangeStart: "" }),
  );
  assert.throws(() =>
    model.selectVersePool(quran, {
      ...base,
      mode: "custom",
      customConfig: {
        ...model.defaultCustomConfig,
        type: "include",
        items: [],
      },
    }),
  );
  const exact = model.selectVersePool(quran, {
    ...base,
    mode: "custom",
    customConfig: {
      type: "exact",
      items: [],
      exact: { startSurah: 8, startAyah: 52, endSurah: 8, endAyah: 54 },
    },
  });
  assert.deepEqual(exact.map(model.verseKey), ["8:52", "8:53", "8:54"]);
});
test("masks cover line edges, keep visible neighbours, and fail closed when word data is missing", () => {
  const page = {
    width: 100,
    height: 50,
    regions: [
      [1, 1, 1, 55, 5, 95, 40],
      [1, 2, 1, 5, 5, 45, 40],
    ],
    glyphs: [
      [1, 1, 1, 1, 75, 5, 95, 40],
      [1, 1, 2, 1, 55, 5, 70, 40],
      [1, 2, 1, 1, 25, 5, 45, 40],
      [1, 2, 0, 1, 5, 5, 20, 40],
    ],
  };
  const masked = artwork.concealmentBounds(
    page,
    (key) => key === "1:1",
    "1:1",
    null,
  );
  assert.deepEqual(masked, [[0, 0, 50, 46]]);
  const partial = artwork.concealmentBounds(page, () => true, "1:1", 1);
  assert.equal(partial.length, 1);
  assert.ok(partial[0][2] > 70 && partial[0][2] < 75);
  assert.deepEqual(
    artwork.concealmentBounds(
      { ...page, glyphs: undefined },
      () => true,
      "1:1",
      1,
    ),
    [[50, 0, 100, 46]],
  );
});
test("native glyph bounds cover the full corpus with a single canonical position per supported word", async () => {
  const unsupported = new Set(
    JSON.parse(
      await readFile(
        new URL(
          "../src/assets/mushaf-partial-unsupported.json",
          import.meta.url,
        ),
        "utf8",
      ),
    ),
  );
  const positions = new Map();
  for (let page = 1; page <= 604; page++) {
    const data = JSON.parse(
      await readFile(
        new URL(
          "../public/mushaf/dar-al-marefa/" + page + ".json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    assert.ok(data.glyphs.length);
    for (const [s, a, word, line, left, top, right, bottom] of data.glyphs) {
      assert.ok(
        left >= 0 &&
          right <= data.width &&
          top >= 0 &&
          bottom <= data.height &&
          line >= 1 &&
          line <= 15,
      );
      const key = s + ":" + a;
      if (!positions.has(key)) positions.set(key, new Set());
      if (word > 0) positions.get(key).add(word);
    }
  }
  assert.equal(positions.size, 6236);
  for (const [key, words] of positions) {
    if (unsupported.has(key)) {
      assert.equal(words.size, 0);
      continue;
    }
    const max = Math.max(...words);
    assert.equal(words.size, max);
    assert.equal(max,previewSegments(quran.find(v=>model.verseKey(v)===key).text,Infinity).filter(segment=>segment.isWord).length,key);
    assert.ok(max > 0);
  }
});
