import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Search, X, Download, Upload } from "lucide-react";
import Seo from "../lib/Seo";
import { useLibrary } from "./LibraryProvider";
import { normalizeSearch, validateEntry, type Entry } from "./model";
import { reference, verseText, verseWords } from "./quran";
import chapters from "../assets/chapters.json";
// eslint-disable-next-line react-refresh/only-export-components
export function entryTitle(entry: Entry) {
  return (
    entry.title ||
    verseWords(entry.passages[0]?.verse).slice(0, 6).join(" ") ||
    "Untitled comparison"
  );
}
export function SyncStatus() {
  const { user, pending, syncing, error, message } = useLibrary();
  return (
    <div className="library-status">
      <Link to="/library/account">
        {syncing
          ? "Syncing…"
          : !user
            ? "Saved on this device"
            : pending
              ? "Saved on this device · sync pending"
              : "Synced"}
        <ArrowUpRight size={14} />
      </Link>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
export default function Library() {
  const { rows, ready, save, scope } = useLibrary();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const upload = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const visible = rows
    .filter((r) =>
      normalizeSearch(
        [
          entryTitle(r.entry),
          r.entry.notes,
          ...r.entry.passages.map(
            (p) =>
              p.verse +
              " " +
              reference(p.verse) +
              " " +
              verseText(p.verse) +
              " " +
              p.note,
          ),
        ].join(" "),
      ).includes(normalizeSearch(query)),
    )
    .sort((a, b) => b.entry.updatedAt.localeCompare(a.entry.updatedAt));
  function backup() {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            format: "ayahvault-library",
            version: 1,
            entries: rows.map((r) => r.entry),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      "ayahvault-library-" + new Date().toISOString().slice(0, 10) + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="library-page">
      <Seo title="Library" />
      <header className="library-heading">
        <div>
          <h1>Library</h1>
          <p>Mutashabihat</p>
        </div>
        <Link to="/library/new" className="library-primary">
          <Plus size={17} />
          New Entry
        </Link>
      </header>
      <SyncStatus />
      <div className="library-tools">
        <label>
          <Search size={18} />
          <input
            aria-label="Search Library"
            placeholder="Search your entries"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              className="icon-button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
        </label>
      </div>
      {!ready ? (
        <p className="library-empty">Loading</p>
      ) : visible.length ? (
        <ol className="library-list">
          {visible.map((r, i) => (
            <li key={r.id}>
              <Link to={"/library/" + r.id}>
                <span className="library-ordinal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h2 dir="auto">{entryTitle(r.entry)}</h2>
                  <p>
                    {r.entry.passages
                      .map((p) => reference(p.verse))
                      .join(" · ")}
                  </p>
                </div>
                <ArrowUpRight size={21} />
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="library-empty">
          <h2>
            {query
              ? "No matching entries"
              : "Keep the distinctions that help you remember."}
          </h2>
          <p>
            {query
              ? "Try another phrase or ayah reference."
              : "Collect similar ayahs, mark what changes, and keep your memory notes together."}
          </p>
          {!query && <Link to="/library/new">Create your first entry →</Link>}
        </div>
      )}
      <footer className="library-backup">
        <button disabled={!ready} onClick={backup}>
          <Download size={16} />
          Export Backup
        </button>
        <button
          disabled={!ready || importing}
          onClick={() => upload.current?.click()}
        >
          <Upload size={16} />
          {importing ? "Importing…" : "Import Backup"}
        </button>
        <input
          ref={upload}
          hidden
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setImporting(true);
            setNotice("");
            try {
              if (file.size > 10_000_000)
                throw new Error("Backup is too large.");
              const data = JSON.parse(await file.text());
              if (
                data.format !== "ayahvault-library" ||
                data.version !== 1 ||
                !Array.isArray(data.entries) ||
                data.entries.length > 1000 ||
                !data.entries.every((v: unknown) =>
                  validateEntry(
                    v,
                    chapters.map((c) => c.verses),
                    (key) => verseWords(key).length,
                  ),
                )
              )
                throw new Error(
                  "This backup contains unsupported or invalid entries.",
                );
              const existing = new Set(
                rows.map((r) => JSON.stringify(r.entry)),
              );
              let count = 0;
              for (const entry of data.entries as Entry[]) {
                if (existing.has(JSON.stringify(entry))) continue;
                const id = rows.some((r) => r.id === entry.id)
                  ? crypto.randomUUID()
                  : entry.id;
                await save({ ...entry, id }, scope);
                count++;
              }
              setNotice(
                "Imported " + count + " entries. Existing entries were kept.",
              );
            } catch (err) {
              setNotice(
                err instanceof Error ? err.message : "Couldn’t import backup.",
              );
            } finally {
              setImporting(false);
            }
          }}
        />
      </footer>
      {notice && <p role="status">{notice}</p>}
    </div>
  );
}
