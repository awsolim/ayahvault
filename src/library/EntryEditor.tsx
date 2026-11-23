import { useEffect, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Plus,
  Search,
  Undo2,
  X,
} from "lucide-react";
import { useLibrary } from "./LibraryProvider";
import {
  assignSpan,
  newEntry,
  palette,
  validateEntry,
  type Entry,
  type Span,
} from "./model";
import { findVerses, reference, verseWords } from "./quran";
import chapters from "../assets/chapters.json";
import Dialog from "./Dialog";
import Seo from "../lib/Seo";
export default function EntryEditor() {
  const { id } = useParams();
  const library = useLibrary();
  const [params] = useSearchParams();
  if (!library.ready) return <p className="library-empty">Loading</p>;
  const initial = id ? library.rows.find((r) => r.id === id)?.entry : undefined;
  if (id && !initial)
    return (
      <div className="library-empty">
        Entry not found. <Link to="/library">Library</Link>
      </div>
    );
  const verse = params.get("ayah") || undefined;
  return (
    <Editor
      key={library.scope + ":" + (id || "new")}
      scope={library.scope}
      initial={initial}
      verse={verse && verseWords(verse).length ? verse : undefined}
    />
  );
}
function Editor({
  initial,
  verse,
  scope,
}: {
  initial?: Entry;
  verse?: string;
  scope: string;
}) {
  const { save } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const draftKey = "ayahvault-draft:" + scope + ":" + (initial?.id || "new");
  const [entry, setEntry] = useState<Entry>(() => {
    try {
      const cached = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (
        validateEntry(
          cached,
          chapters.map((c) => c.verses),
          (key) => verseWords(key).length,
        )
      )
        return cached;
    } catch {
      /* Start a new draft. */
    }
    return initial ? structuredClone(initial) : newEntry(verse);
  });
  const [picker, setPicker] = useState(false);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Span | null>(null);
  const [anchor, setAnchor] = useState<{ verse: string; word: number } | null>(
    null,
  );
  const [editingMarks, setEditingMarks] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const history = useRef<Entry[]>([]);
  const finished = useRef(false);
  const [dirty, setDirty] = useState(() => {
    try {
      return !!sessionStorage.getItem(draftKey);
    } catch {
      return false;
    }
  });
  function update(next: Entry) {
    history.current.push(entry);
    if (history.current.length > 30) history.current.shift();
    setEntry(next);
    setDirty(true);
  }
  useEffect(() => {
    if (!dirty || finished.current) return;
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(entry));
    } catch {
      /* Explicit save still uses IndexedDB. */
    }
  }, [entry, draftKey, dirty]);
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (dirty && !finished.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);
  function wordClick(key: string, word: number) {
    if (anchor?.verse === key) {
      setRange({
        verse: key,
        start: Math.min(anchor.word, word),
        end: Math.max(anchor.word, word),
      });
      setAnchor(null);
    } else {
      setAnchor({ verse: key, word });
      setRange(null);
    }
  }
  async function submit() {
    setSaving(true);
    setError("");
    try {
      await save(entry, scope);
      finished.current = true;
      sessionStorage.removeItem(draftKey);
      navigate("/library/" + entry.id, {
        replace: true,
        state: location.state,
      });
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn’t save. Your draft is still open.",
      );
    } finally {
      setSaving(false);
    }
  }
  const results = findVerses(query);
  return (
    <div className="library-page editor-page">
      <Seo title={initial ? "Edit comparison" : "New comparison"} />
      <div className="editor-top">
        <Link
          className="library-back"
          to={initial ? "/library/" + initial.id : "/library"}
          state={location.state}
        >
          <ArrowLeft size={17} />
          Back
        </Link>
        <span>{dirty ? "Unsaved draft" : "Mutashabihat"}</span>
        <button
          className="library-primary"
          disabled={!entry.passages.length || saving}
          onClick={() => void submit()}
        >
          {saving ? "Saving…" : "Save Entry"}
        </button>
      </div>
      <label className="entry-title-input">
        <span>
          Title <small>optional</small>
        </span>
        <input
          dir="auto"
          maxLength={200}
          placeholder="Use the opening phrase"
          value={entry.title}
          onChange={(e) => update({ ...entry, title: e.target.value })}
        />
      </label>
      <div className="editor-section-heading">
        <h2>
          Passages <span>{entry.passages.length}</span>
        </h2>
        <button
          className="library-text-button"
          onClick={() => setPicker(true)}
          disabled={entry.passages.length >= 100}
        >
          <Plus size={17} />
          Add Ayah
        </button>
      </div>
      {!entry.passages.length && (
        <div className="library-empty">
          <p>Add the ayahs you want to compare.</p>
          <button
            className="library-text-button"
            onClick={() => setPicker(true)}
          >
            Find an ayah →
          </button>
        </div>
      )}
      {entry.passages.length > 0 && (
        <div className="comparison-edit-tools">
          <p>
            {anchor
              ? "Now tap the last word (or the same word for one)."
              : "Tap the first and last words to mark a phrase."}
          </p>
          <button
            className="icon-button"
            disabled={!history.current.length}
            aria-label="Undo last edit"
            onClick={() => {
              const previous = history.current.pop();
              if (previous) {
                setEntry(previous);
                setDirty(true);
              }
            }}
          >
            <Undo2 size={18} />
          </button>
        </div>
      )}
      <div className="comparison-passages">
        {entry.passages.map((p, index) => (
          <article key={p.verse}>
            <header>
              <h2>
                {reference(p.verse)} <span>{p.verse}</span>
              </h2>
              <div className="passage-order">
                <button
                  className="icon-button"
                  aria-label={"Move " + p.verse + " up"}
                  disabled={!index}
                  onClick={() => {
                    const passages = [...entry.passages];
                    [passages[index - 1], passages[index]] = [
                      passages[index],
                      passages[index - 1],
                    ];
                    update({ ...entry, passages });
                  }}
                >
                  <ArrowUp size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Move " + p.verse + " down"}
                  disabled={index === entry.passages.length - 1}
                  onClick={() => {
                    const passages = [...entry.passages];
                    [passages[index + 1], passages[index]] = [
                      passages[index],
                      passages[index + 1],
                    ];
                    update({ ...entry, passages });
                  }}
                >
                  <ArrowDown size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Remove " + p.verse}
                  onClick={() => {
                    update({
                      ...entry,
                      passages: entry.passages.filter(
                        (v) => v.verse !== p.verse,
                      ),
                      marks: entry.marks.map((m) => ({
                        ...m,
                        spans: m.spans.filter((s) => s.verse !== p.verse),
                      })),
                    });
                    setRange(null);
                    setAnchor(null);
                  }}
                >
                  <X size={17} />
                </button>
              </div>
            </header>
            <p className="comparison-arabic" dir="rtl" lang="ar">
              {verseWords(p.verse).map((word, i) => {
                const position = i + 1;
                const mark = entry.marks.find((m) =>
                  m.spans.some(
                    (s) =>
                      s.verse === p.verse &&
                      s.start <= position &&
                      s.end >= position,
                  ),
                );
                const selected =
                  (range?.verse === p.verse &&
                    range.start <= position &&
                    range.end >= position) ||
                  (anchor?.verse === p.verse && anchor.word === position);
                return (
                  <span key={i}>
                    <button
                      type="button"
                      aria-label={
                        word +
                        ", word " +
                        position +
                        ", " +
                        p.verse +
                        (mark ? ", " + mark.label : "")
                      }
                      aria-pressed={!!selected}
                      title={mark?.label}
                      className={
                        (selected ? "word-select " : "") +
                        (mark ? "marked-word" : "")
                      }
                      style={
                        mark
                          ? {
                              textDecorationColor: mark.color,
                              backgroundColor: mark.color + "26",
                            }
                          : undefined
                      }
                      onClick={() => wordClick(p.verse, position)}
                    >
                      {word}
                    </button>{" "}
                  </span>
                );
              })}
            </p>
            <label className="passage-note-input">
              <span>
                Note for this ayah <small>optional</small>
              </span>
              <textarea
                rows={1}
                dir="auto"
                maxLength={10000}
                value={p.note}
                onChange={(e) =>
                  update({
                    ...entry,
                    passages: entry.passages.map((v) =>
                      v.verse === p.verse ? { ...v, note: e.target.value } : v,
                    ),
                  })
                }
              />
            </label>
          </article>
        ))}
      </div>
      {entry.marks.length > 0 && (
        <section className="legend-editor">
          <div className="editor-section-heading">
            <h2>Comparison Marks</h2>
            <button
              className="library-text-button"
              onClick={() => setEditingMarks(!editingMarks)}
            >
              {editingMarks ? "Done" : "Edit Legend"}
            </button>
          </div>
          <div className="comparison-legend">
            {entry.marks.map((m, i) =>
              editingMarks ? (
                <div className="legend-row" key={m.id}>
                  <span>{i + 1}.</span>
                  <select
                    aria-label={"Color for " + m.label}
                    value={m.color}
                    onChange={(e) =>
                      update({
                        ...entry,
                        marks: entry.marks.map((mark) =>
                          mark.id === m.id
                            ? { ...mark, color: e.target.value }
                            : mark,
                        ),
                      })
                    }
                  >
                    {palette.map((c, j) => (
                      <option key={c} value={c}>
                        {["Gold", "Blue", "Plum", "Green", "Copper"][j]}
                      </option>
                    ))}
                  </select>
                  <input
                    aria-label="Mark label"
                    maxLength={80}
                    value={m.label}
                    onChange={(e) =>
                      update({
                        ...entry,
                        marks: entry.marks.map((mark) =>
                          mark.id === m.id
                            ? { ...mark, label: e.target.value }
                            : mark,
                        ),
                      })
                    }
                  />
                  <button
                    className="icon-button"
                    aria-label={"Delete " + m.label + " mark"}
                    onClick={() =>
                      update({
                        ...entry,
                        marks: entry.marks.filter((mark) => mark.id !== m.id),
                      })
                    }
                  >
                    <X size={17} />
                  </button>
                </div>
              ) : (
                <span key={m.id}>
                  <i style={{ background: m.color }} />
                  {i + 1}. {m.label}
                </span>
              ),
            )}
          </div>
        </section>
      )}
      <label className="memory-notes entry-notes">
        <h2>Memory Notes</h2>
        <textarea
          rows={4}
          dir="auto"
          maxLength={20000}
          value={entry.notes}
          onChange={(e) => update({ ...entry, notes: e.target.value })}
        />
      </label>
      {error && (
        <div>
          <p role="alert" className="library-error">
            {error}
          </p>
          <button
            className="library-text-button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                const copy = {
                  ...entry,
                  id: crypto.randomUUID(),
                  title:
                    (entry.title.slice(0, 180) || "Comparison") + " — copy",
                };
                await save(copy, scope);
                finished.current = true;
                sessionStorage.removeItem(draftKey);
                navigate("/library/" + copy.id, {
                  replace: true,
                  state: location.state,
                });
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Couldn’t save copy.",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Save Draft as New Entry
          </button>
        </div>
      )}
      <footer className="editor-footer">
        <p>Saved entries stay on this device. Sign in from Library to sync.</p>
        {dirty && (
          <button
            className="library-text-button"
            onClick={() => {
              if (!window.confirm("Discard this unsaved draft?")) return;
              finished.current = true;
              sessionStorage.removeItem(draftKey);
              navigate(initial ? "/library/" + initial.id : "/library", {
                state: location.state,
              });
            }}
          >
            Discard Draft
          </button>
        )}
      </footer>
      {picker && (
        <Dialog title="Add Ayah" close={() => setPicker(false)}>
          <label className="verse-picker-search">
            <Search size={18} />
            <input
              autoFocus
              placeholder="Search surah, phrase, or ayah"
              aria-label="Find an ayah"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <ul className="verse-picker-results">
            {results.map((v) => {
              const added = entry.passages.some((p) => p.verse === v.key);
              return (
                <li key={v.key}>
                  <button
                    disabled={added}
                    onClick={() => {
                      update({
                        ...entry,
                        passages: [
                          ...entry.passages,
                          { verse: v.key, note: "" },
                        ],
                      });
                      setPicker(false);
                      setQuery("");
                    }}
                  >
                    <span>
                      {reference(v.key)} · {v.key}
                      {added ? " · Added" : " +"}
                    </span>
                    <p dir="rtl" lang="ar">
                      {v.text}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
          {query && !results.length && <p>No matching ayahs.</p>}
          <p className="library-muted">
            Search by reference, surah name, or Arabic wording.
          </p>
        </Dialog>
      )}
      {range && (
        <MarkPicker
          range={range}
          entry={entry}
          apply={(id) => {
            update(assignSpan(entry, id, range));
            setRange(null);
          }}
          create={(label) => {
            const id = crypto.randomUUID();
            update(
              assignSpan(
                {
                  ...entry,
                  marks: [
                    ...entry.marks,
                    {
                      id,
                      label,
                      color: palette[entry.marks.length % palette.length],
                      spans: [],
                    },
                  ],
                },
                id,
                range,
              ),
            );
            setRange(null);
          }}
          close={() => setRange(null)}
        />
      )}
    </div>
  );
}
function MarkPicker({
  range,
  entry,
  apply,
  create,
  close,
}: {
  range: Span;
  entry: Entry;
  apply: (id: string) => void;
  create: (label: string) => void;
  close: () => void;
}) {
  const [label, setLabel] = useState("");
  return (
    <Dialog title="Mark Phrase" close={close}>
      <p className="selected-phrase" dir="rtl" lang="ar">
        {verseWords(range.verse)
          .slice(range.start - 1, range.end)
          .join(" ")}
      </p>
      <div className="mark-choices">
        {entry.marks.map((m, i) => (
          <button key={m.id} onClick={() => apply(m.id)}>
            <i style={{ background: m.color }} />
            {i + 1}. {m.label}
          </button>
        ))}
      </div>
      {entry.marks.length < 30 && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (label.trim()) create(label.trim());
          }}
        >
          <label className="library-field">
            New mark
            <input
              maxLength={80}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </label>
          <button className="library-primary" disabled={!label.trim()}>
            Create Mark
          </button>
        </form>
      )}
      <button className="library-text-button" onClick={() => apply("")}>
        Clear marks from this phrase
      </button>
    </Dialog>
  );
}
