import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useLibrary } from "./LibraryProvider";
import Dialog from "./Dialog";
export default function AyahLinks({
  verse,
  close,
  page,
  readerState,
}: {
  verse: string;
  close: () => void;
  page: number;
  readerState: {
    chromeOpen: boolean;
    selected: string | null;
    highlight: string | null;
  };
}) {
  const { rows, save, scope, ready } = useLibrary();
  const location = useLocation();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const linked = rows.filter((r) =>
    r.entry.passages.some((p) => p.verse === verse),
  );
  const others = rows.filter(
    (r) => !r.entry.passages.some((p) => p.verse === verse),
  );
  const state = {
    returnTo: "/mushaf?page=" + page,
    returnState: {
      ...location.state,
      readerChromeOpen: readerState.chromeOpen,
      readerSelected: readerState.selected,
      readerHighlight: readerState.highlight,
    },
  };
  return (
    <Dialog title={"Mutashabihat · " + verse} close={close}>
      {error && <p role="alert">{error}</p>}
      {linked.length > 0 && (
        <>
          <h3>Linked entries</h3>
          <ul className="entry-picker">
            {linked.map((r) => (
              <li key={r.id}>
                <Link to={"/library/" + r.id} state={state}>
                  {r.entry.title ||
                    r.entry.passages.map((p) => p.verse).join(" · ")}
                  <span>Open entry →</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      <Link
        className="library-primary full-button"
        to={"/library/new?ayah=" + verse}
        state={state}
      >
        New Entry
      </Link>
      {others.length > 0 && (
        <>
          <h3>Add to Existing</h3>
          <ul className="entry-picker">
            {others.map((r) => (
              <li key={r.id}>
                <button
                  disabled={!ready || busy}
                  onClick={async () => {
                    setBusy(true);
                    try {
                      await save(
                        {
                          ...r.entry,
                          passages: [...r.entry.passages, { verse, note: "" }],
                        },
                        scope,
                      );
                      close();
                    } catch (e) {
                      setError(String(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  {r.entry.title ||
                    r.entry.passages.map((p) => p.verse).join(" · ")}
                  <span>Add ayah +</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Dialog>
  );
}
