// src/apps/arabuddy/AraBuddy.tsx
import { useMemo, useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient"; // NOTE: adjust this relative path if your project differs
import Spinner from "../../components/ui/Spinner";   // NEW: themed spinner

type Lang = "en" | "ar";

// NEW: lowercase fields to match your Supabase schema exactly
type VocabRow = {
  id: number;
  arabic: string;
  english: string;
};

type Card = {
  id: string;
  pairId: string;
  lang: Lang;
  label: string;
  matched: boolean;
};

/** Fisher–Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AraBuddy() {
  // Keep one selection per language
  const [selectedByLang, setSelectedByLang] = useState<{ en?: string; ar?: string }>({});
  const [cards, setCards] = useState<Card[]>([]);
  const [lives, setLives] = useState<number>(3);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "won" | "lost">("idle");
  const [round, setRound] = useState<number>(1);

  // NEW: loading and error states to control spinner and message
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // NEW: fetch a batch, then pick 8 random pairs client-side
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);     // NEW: show spinner as soon as we start
      setLoadError(null);

      const { data, error } = await supabase
        .from("arabuddy")
        .select("id, arabic, english") // IMPORTANT: lowercase column names
        .limit(128);                   // small batch; randomized locally

      if (cancelled) return;

      if (error) {
        console.error("[arabuddy] select error:", error?.message ?? error);
        setCards([]);
        setSelectedByLang({});
        setLives(3);
        setStatus("idle");
        setLoadError("Could not load words. Please try again.");
        setLoading(false);            // NEW: stop spinner on error
        return;
      }

      if (!data || data.length === 0) {
        setCards([]);
        setSelectedByLang({});
        setLives(3);
        setStatus("idle");
        setLoadError("No words found. Add rows to the arabuddy table.");
        setLoading(false);            // NEW: stop spinner when empty
        return;
      }

      // Pick 8 random rows
      const sample = shuffle(data as VocabRow[]).slice(0, 8);

      // Make Arabic (top) and English (bottom) decks; shuffle within each lane
      const arCards: Card[] = shuffle(
        sample.map(p => ({
          id: `${p.id}-ar`,
          pairId: String(p.id),
          lang: "ar",
          label: p.arabic,
          matched: false,
        }))
      );

      const enCards: Card[] = shuffle(
        sample.map(p => ({
          id: `${p.id}-en`,
          pairId: String(p.id),
          lang: "en",
          label: p.english,
          matched: false,
        }))
      );

      setCards([...arCards, ...enCards]);
      setSelectedByLang({});
      setLives(3);
      setStatus("idle");
      setLoading(false);              // NEW: hide spinner once ready
    })();

    return () => {
      cancelled = true;               // avoid setState after unmount
    };
  }, [round]);

  const remaining = useMemo(() => cards.filter(c => !c.matched).length, [cards]);

  function toggleSelect(id: string) {
    const card = cards.find(c => c.id === id);
    if (!card || card.matched || status === "won" || status === "lost") return;
    setStatus("idle");

    setSelectedByLang(prev => {
      // Clicking the same card again unselects it
      if ((card.lang === "en" && prev.en === id) || (card.lang === "ar" && prev.ar === id)) {
        const next = { ...prev };
        delete (next as any)[card.lang];
        return next;
      }
      // Otherwise, replace selection for that language
      return { ...prev, [card.lang]: id };
    });
  }

  const enSel = selectedByLang.en ? cards.find(c => c.id === selectedByLang.en) : undefined;
  const arSel = selectedByLang.ar ? cards.find(c => c.id === selectedByLang.ar) : undefined;
  const canMatch = Boolean(enSel && arSel) && status !== "won" && status !== "lost";

  // Enter key = match
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && canMatch) handleMatch();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canMatch, selectedByLang, cards, status]);

  function handleMatch() {
    if (!enSel || !arSel) return;

    const isCorrect = enSel.pairId === arSel.pairId;
    if (isCorrect) {
      setCards(prev =>
        prev.map(c => (c.id === enSel.id || c.id === arSel.id ? { ...c, matched: true } : c))
      );
      setSelectedByLang({});
      setStatus("correct");

      setTimeout(() => {
        const left = cards.filter(c => !c.matched && c.id !== enSel.id && c.id !== arSel.id).length;
        if (left === 0) setStatus("won");
        else setStatus("idle");
      }, 250);
    } else {
      setStatus("wrong");
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) setTimeout(() => setStatus("lost"), 250);
        return next;
      });
      setTimeout(() => setSelectedByLang({}), 400);
    }
  }

  function newRound() {
    setRound(r => r + 1);             // triggers a fresh fetch (spinner shows again)
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-center text-3xl font-bold text-purple-700">AraBuddy</h1>
      </div>

      {/* Lives + New Round */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <div className="text-2xl select-none" aria-label={`Lives: ${lives}`}>
          {"❤️".repeat(lives)}
          {"🤍".repeat(Math.max(0, 3 - lives))}
        </div>
        <button
          onClick={newRound}
          className="rounded-lg border border-purple-300 bg-white px-3 py-1.5 text-purple-700 hover:bg-purple-700 hover:text-white"
          title="Start a new round"
        >
          New Round
        </button>
      </div>

      {/* Themed loading & error panels */}
      {loading ? (
        // NEW: Purple to match AraBuddy’s theme (see Home page theme map)
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner
            message=""
            colorClassName="text-purple-600"  // NEW: theme color for AraBuddy
            size={32}
            thickness={3}
          />
        </div>
      ) : loadError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {loadError}
          <div className="mt-3">
            <button
              onClick={() => setRound(r => r + 1)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      ) : (
        // Board
        <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" aria-label="Matching cards grid">
            {cards.map(card => {
              const isSelected =
                (card.lang === "en" && selectedByLang.en === card.id) ||
                (card.lang === "ar" && selectedByLang.ar === card.id);
              const isGone = card.matched;

              return (
                <button
                  key={card.id}
                  onClick={() => toggleSelect(card.id)}
                  disabled={isGone || status === "won" || status === "lost"}
                  className={[
                    "relative h-24 rounded-xl border text-center transition flex items-center justify-center px-2",
                    isGone ? "pointer-events-none opacity-0 scale-90 h-0 p-0 m-0 border-0" : "",
                    isSelected
                      ? "border-purple-600 bg-purple-600 text-white animate-vibrate"
                      : "border-slate-200 hover:bg-purple-50",
                    status === "wrong" && isSelected ? "bg-red-500 text-white" : "",
                    status === "correct" && isSelected ? "animate-pop border-green-500" : "",
                  ].join(" ")}
                  aria-pressed={isSelected}
                  aria-label={`${card.lang === "ar" ? "Arabic" : "English"} card`}
                  dir={card.lang === "ar" ? "rtl" : "ltr"}
                >
                  <span className="text-sm sm:text-base md:text-lg font-medium select-none">{card.label}</span>
                  <span className="absolute right-2 top-2 text-[10px] text-purple-200">{card.lang.toUpperCase()}</span>
                </button>
              );
            })}
          </div>

          {/* Controls under grid */}
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Remaining: <span className="font-semibold">{remaining}</span> · Selected:{" "}
              <span className="font-semibold">{Number(Boolean(enSel)) + Number(Boolean(arSel))}</span>
            </div>

            <button
              onClick={handleMatch}
              disabled={!canMatch}
              className={[
                "rounded-lg px-4 py-2 font-semibold transition",
                canMatch ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-slate-200 text-slate-500 cursor-not-allowed",
              ].join(" ")}
              title="Press Enter to match"
            >
              Match
            </button>
          </div>

          {/* Status banners */}
          {status === "won" && (
            <div className="mt-4 rounded-md bg-green-50 p-3 text-green-700">🎉 Great job! You matched all pairs.</div>
          )}
          {status === "lost" && (
            <div className="mt-4 rounded-md bg-red-50 p-3 text-red-700">💡 Out of lives. Try a new round!</div>
          )}
        </div>
      )}
    </div>
  );
}
