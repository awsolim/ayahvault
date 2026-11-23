import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import "fake-indexeddb/auto";
import ts from "typescript";
async function load(path) {
  const text = await readFile(new URL(path, import.meta.url), "utf8");
  const code = ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.ESNext },
  }).outputText;
  return import(
    "data:text/javascript;base64," + Buffer.from(code).toString("base64")
  );
}
const model = await load("../src/library/model.ts");
const storage = await load("../src/library/storage.ts");
const sync = await load("../src/library/sync.ts");
const counts = JSON.parse(
  await readFile(
    new URL("../src/assets/chapters.json", import.meta.url),
    "utf8",
  ),
).map((c) => c.verses);

test("claiming a restored guest entry preserves a colliding account edit", async () => {
  const entry = model.newEntry("3:11");
  const guest = {
    key: "guest:" + entry.id,
    scope: "guest",
    id: entry.id,
    entry,
    revision: 0,
    dirty: true,
    deleted: false,
  };
  await storage.changeRow("collision:" + entry.id, () => ({
    ...guest,
    key: "collision:" + entry.id,
    scope: "collision",
    entry: { ...entry, notes: "Account edit" },
  }));
  await storage.changeRow(guest.key, () => ({
    ...guest,
    entry: { ...entry, notes: "Guest edit" },
  }));
  await storage.claimGuest("collision");
  const rows = await storage.readRows("collision");
  assert.equal(rows.length, 2);
  assert.deepEqual(
    new Set(rows.map((r) => r.entry.notes)),
    new Set(["Guest edit", "Account edit"]),
  );
});
test("entries validate references, source version, ranges, duplicate ayahs, and backup limits", () => {
  const entry = model.newEntry("3:11");
  assert.ok(model.validateEntry(entry, counts, () => 15));
  for (const bad of [
    { ...entry, passages: [{ verse: "3:999", note: "" }] },
    { ...entry, passages: [{ verse: "03:11", note: "" }] },
    { ...entry, textVersion: "other" },
    { ...entry, passages: [...entry.passages, ...entry.passages] },
    {
      ...entry,
      marks: [
        {
          id: "a",
          color: "#123456",
          label: "Mark",
          spans: [{ verse: "3:11", start: 1, end: 16 }],
        },
      ],
    },
  ])
    assert.equal(
      model.validateEntry(bad, counts, () => 15),
      false,
    );
});
test("reassigning a phrase splits previous ranges and leaves other ayahs intact", () => {
  const entry = {
    ...model.newEntry("3:11"),
    marks: [
      {
        id: "a",
        label: "Shared",
        color: "#123456",
        spans: [
          { verse: "3:11", start: 1, end: 10 },
          { verse: "8:52", start: 1, end: 5 },
        ],
      },
      { id: "b", label: "Different", color: "#654321", spans: [] },
    ],
  };
  const next = model.assignSpan(entry, "b", {
    verse: "3:11",
    start: 4,
    end: 7,
  });
  assert.deepEqual(next.marks[0].spans, [
    { verse: "3:11", start: 1, end: 3 },
    { verse: "3:11", start: 8, end: 10 },
    { verse: "8:52", start: 1, end: 5 },
  ]);
  assert.deepEqual(next.marks[1].spans, [{ verse: "3:11", start: 4, end: 7 }]);
  assert.equal(entry.marks[0].spans[0].end, 10);
});
test("device transactions isolate accounts and claim guest entries once", async () => {
  const entry = model.newEntry("8:52");
  const guest = {
    key: "guest:" + entry.id,
    scope: "guest",
    id: entry.id,
    entry,
    revision: 0,
    dirty: true,
    deleted: false,
  };
  await storage.changeRow(guest.key, () => guest);
  await storage.claimGuest("account-a");
  await storage.claimGuest("account-a");
  assert.equal((await storage.readRows("guest")).length, 0);
  assert.equal((await storage.readRows("account-b")).length, 0);
  const rows = await storage.readRows("account-a");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].entry.passages[0].verse, "8:52");
  await storage.changeRow(rows[0].key, (row) => ({ ...row, deleted: true }));
  assert.equal((await storage.readRows("account-a"))[0].deleted, true);
});
test("sync acknowledgements retain edits or deletion made while upload was pending", () => {
  const entry = model.newEntry("8:54");
  const sent = {
    key: "a:" + entry.id,
    scope: "a",
    id: entry.id,
    entry,
    revision: 1,
    dirty: true,
    deleted: false,
  };
  const remote = { id: entry.id, payload: entry, revision: 2, deleted: false };
  assert.equal(sync.acknowledge(sent, sent, remote).dirty, false);
  const edited = { ...sent, entry: { ...entry, notes: "New note" } };
  assert.equal(sync.acknowledge(edited, sent, remote).dirty, true);
  assert.equal(sync.acknowledge(edited, sent, remote).revision, 2);
  assert.equal(
    sync.acknowledge({ ...sent, deleted: true }, sent, remote).dirty,
    true,
  );
  assert.equal(sync.acceptRemote(edited, remote, "a"), edited);
});
test("conflicting device and cloud edits are preserved atomically as two entries", async () => {
  const entry = model.newEntry("3:11");
  entry.notes = "Latest offline note";
  const row = {
    key: "conflict:" + entry.id,
    scope: "conflict",
    id: entry.id,
    entry,
    revision: 1,
    dirty: true,
    deleted: false,
  };
  await storage.changeRow(row.key, () => row);
  await storage.resolveConflict(row.key, {
    id: entry.id,
    payload: { ...entry, notes: "Other device note" },
    revision: 2,
    deleted: false,
  });
  const rows = await storage.readRows("conflict");
  assert.equal(rows.length, 2);
  assert.ok(
    rows.some((r) => r.entry.notes === "Latest offline note" && r.dirty),
  );
  assert.ok(
    rows.some(
      (r) =>
        r.entry.notes === "Other device note" && !r.dirty && r.revision === 2,
    ),
  );
});
