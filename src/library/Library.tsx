import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Plus, Search, X, Download, Upload, ListChecks, Trash2 } from "lucide-react";
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
  const { scope } = useLibrary();
  return <LibraryContents key={scope} />;
}

function LibraryContents() {
  const { rows, ready, save, remove, scope } = useLibrary();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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
  const selectedIds = selected.filter((id) => rows.some((r) => r.id === id));
  const Summary = selecting ? "span" : "div";
  const Title = selecting ? "span" : "h2";
  const References = selecting ? "span" : "p";
  async function deleteSelected() {
    const count = selectedIds.length;
    if (!count || !window.confirm(count === 1 ? "Delete 1 entry?" : `Delete ${count} entries?`)) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await remove(selectedIds);
      setSelected([]);
      setSelecting(false);
      setNotice(count === 1 ? "Deleted 1 entry." : `Deleted ${count} entries.`);
    } catch {
      setDeleteError("Couldn’t delete the selected entries. Try again.");
    } finally {
      setDeleting(false);
    }
  }
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
      <div className="library-tools">
        <SyncStatus />
        <div className="library-search">
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
        </div>
      </div>
      <div className="library-list-tools">
        <button
          type="button"
          className="library-text-button"
          aria-pressed={selecting}
          disabled={deleting || (!selecting && !rows.length)}
          onClick={() => {
            setSelecting(!selecting);
            setSelected([]);
            setDeleteError("");
          }}
        >
          {selecting ? <X size={17} /> : <ListChecks size={17} />}
          {selecting ? "Cancel selection" : "Select entries"}
        </button>
        {selecting && (
          <button type="button" className="library-delete" disabled={!selectedIds.length || deleting} onClick={() => void deleteSelected()}>
            <Trash2 size={16} />
            {deleting ? "Deleting…" : `Delete selected (${selectedIds.length})`}
          </button>
        )}
      </div>
      {deleteError && <p role="alert" className="library-error">{deleteError}</p>}
      {!ready ? (
        <p className="library-empty">Loading</p>
      ) : visible.length ? (
        <ol className="library-list">
          {visible.map((r, i) => {
            const checked = selected.includes(r.id);
            const contents = <>
                <span className="library-ordinal">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Summary>
                  <Title className="library-entry-title" dir="auto">{entryTitle(r.entry)}</Title>
                  <References className="library-entry-refs">
                    {r.entry.passages
                      .map((p) => reference(p.verse))
                      .join(" · ")}
                  </References>
                </Summary>
            </>;
            return (
              <li key={r.id}>
                {selecting ? (
                  <label className="library-select-row">
                    <input
                      type="checkbox"
                      aria-label={entryTitle(r.entry)}
                      checked={checked}
                      disabled={deleting}
                      onChange={() => setSelected((ids) =>
                        checked ? ids.filter((id) => id !== r.id) : [...ids, r.id],
                      )}
                    />
                    {contents}
                  </label>
                ) : (
                  <Link to={"/library/" + r.id}>
                    {contents}
                    <ArrowUpRight size={21} />
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="library-empty">{query ? "No matching entries." : "No entries yet."}</p>
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
