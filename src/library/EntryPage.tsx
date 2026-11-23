import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Pencil, Trash2 } from "lucide-react";
import { useLibrary } from "./LibraryProvider";
import { reference } from "./quran";
import ComparisonText from "./ComparisonText";
import { entryTitle, SyncStatus } from "./Library";
import Seo from "../lib/Seo";
export default function EntryPage() {
  const { id } = useParams();
  const { rows, ready, remove } = useLibrary();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const entry = rows.find((r) => r.id === id)?.entry;
  if (!ready) return <p className="library-empty">Loading</p>;
  if (!entry)
    return (
      <div className="library-empty">
        <p>Entry not found on this account or device.</p>
        <Link to="/library">Library</Link>
      </div>
    );
  const back = location.state?.returnTo || "/library";
  return (
    <div className="library-page entry-page">
      <Seo title={entryTitle(entry)} />
      <Link
        className="library-back"
        to={back}
        state={location.state?.returnState}
      >
        <ArrowLeft size={17} />
        {back.startsWith("/mushaf") ? "Mushaf" : "Library"}
      </Link>
      <header className="library-heading">
        <h1 dir="auto">{entryTitle(entry)}</h1>
        <Link
          className="library-text-button"
          to={"/library/" + id + "/edit"}
          state={location.state}
        >
          <Pencil size={16} />
          Edit
        </Link>
      </header>
      <SyncStatus />
      {entry.marks.some((m) => m.spans.length > 0) && (
        <div className="comparison-legend">
          {entry.marks
            .filter((m) => m.spans.length > 0)
            .map((m, i) => (
              <span key={m.id}>
                <i style={{ background: m.color }} />
                {i + 1}. {m.label}
              </span>
            ))}
        </div>
      )}
      <div className="comparison-passages">
        {entry.passages.map((p) => (
          <article key={p.verse}>
            <header>
              <h2>
                {reference(p.verse)} <span>{p.verse}</span>
              </h2>
              <Link
                aria-label={"Open " + reference(p.verse) + " in mushaf"}
                to={"/mushaf?ayah=" + p.verse}
                state={{ from: "library", entryId: id }}
              >
                <ArrowUpRight size={19} />
              </Link>
            </header>
            <ComparisonText verse={p.verse} marks={entry.marks} />
            {p.note && (
              <p className="passage-note" dir="auto">
                {p.note}
              </p>
            )}
          </article>
        ))}
      </div>
      {entry.notes && (
        <section className="memory-notes">
          <h2>Memory Notes</h2>
          <p dir="auto">{entry.notes}</p>
        </section>
      )}
      <footer className="library-backup">
        <button
          className="library-delete"
          disabled={deleting}
          onClick={async () => {
            if (!window.confirm("Delete this entry and its comparison marks?"))
              return;
            setDeleting(true);
            try {
              await remove(entry.id);
              navigate("/library");
            } catch {
              setError("Couldn’t delete this entry. Try again.");
              setDeleting(false);
            }
          }}
        >
          <Trash2 size={16} />
          Delete Entry
        </button>
      </footer>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
