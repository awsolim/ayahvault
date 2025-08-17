// src/apps/arabuddy/AraBuddy.tsx
import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // used by "Back to Home"
import { supabase } from "../../lib/supabaseClient";
import Spinner from "../../components/ui/Spinner";
import Seo from "../../lib/Seo";

type Lang = "en" | "ar";

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
  matched: boolean; // when true, the tile is invisible but keeps its space
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

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const navigate = useNavigate();

  // Timer state — start when round is ready, freeze when round ends
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  // Audio cues (files expected in public/audio/)
  const [correctSound] = useState<HTMLAudioElement>(() => {
    const a = new Audio("/audio/correct.mp3"); // UPDATED: correct sound
    a.preload = "auto";
    return a;
  });
  const [wrongSound] = useState<HTMLAudioElement>(() => {
    const a = new Audio("/audio/wrong.mp3"); // UPDATED: wrong sound
    a.preload = "auto";
    return a;
  });

  // Two-phase visual effect (flash green, then fade)
  const [flashCorrectIds, setFlashCorrectIds] = useState<Set<string>>(new Set()); // step 1: green flash
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());            // step 2: fading opacity

  // Build a round from Supabase
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("arabuddy")
        .select("id, arabic, english")
        .limit(128);

      if (cancelled) return;

      if (error) {
        console.error("[arabuddy] select error:", error?.message ?? error);
        setCards([]);
        setSelectedByLang({});
        setLives(3);
        setStatus("idle");
        setLoadError("Could not load words. Please try again.");
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        setCards([]);
        setSelectedByLang({});
        setLives(3);
        setStatus("idle");
        setLoadError("No words found. Add rows to the arabuddy table.");
        setLoading(false);
        return;
      }

      // Pick 8 random rows
      const sample = shuffle(data as VocabRow[]).slice(0, 8);

      // Make Arabic (top) and English (bottom) decks; shuffle within each lane
      const arCards: Card[] = shuffle(
        sample.map((p): Card => ({
          id: `${p.id}-ar`,
          pairId: String(p.id),
          lang: "ar",
          label: p.arabic,
          matched: false,
        }))
      );

      const enCards: Card[] = shuffle(
        sample.map((p): Card => ({
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
      setElapsedMs(null);
      setStartTime(Date.now());
      setFlashCorrectIds(new Set());
      setFadingIds(new Set());
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [round]);

  // Freeze timer once the round ends (win or loss)
  useEffect(() => {
    if ((status === "won" || status === "lost") && startTime && elapsedMs === null) {
      setElapsedMs(Date.now() - startTime);
    }
  }, [status, startTime, elapsedMs]);

  // mm:ss formatter
  const fmtMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${String(rem).padStart(2, "0")}`;
  };

  // Derived
  const remaining = useMemo(() => cards.filter(c => !c.matched).length, [cards]);
  const isOver = status === "won" || status === "lost";

  function toggleSelect(id: string) {
    const card = cards.find(c => c.id === id);
    if (!card || card.matched || isOver) return;
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
  const canMatch = Boolean(enSel && arSel) && !isOver;

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
      setStatus("correct");
      correctSound.currentTime = 0;            // NEW: play correct sound
      void correctSound.play().catch(() => {});

      // PHASE 1: flash both cards green
      const ids = [enSel.id, arSel.id];
      setFlashCorrectIds(new Set(ids));
      setSelectedByLang({});

      // After a short flash, start the fade (but DO NOT remove from state)
      setTimeout(() => {
        setFlashCorrectIds(new Set());                 // stop flashing
        setFadingIds(prev => new Set([...prev, ...ids])); // start fade

        // After fade completes, just mark matched=true so they stay invisible in place
        setTimeout(() => {
          setCards(prev =>
            prev.map(c => (ids.includes(c.id) ? { ...c, matched: true } : c))
          );
          setFadingIds(new Set());

          // If all pairs matched, end the round
          const left = prevRemainingAfterMark(cards, ids);
          if (left <= 0) setStatus("won");
          else setStatus("idle");
        }, 450); // fade duration ms
      }, 300);   // green flash duration ms
    } else {
      setStatus("wrong");
      wrongSound.currentTime = 0;               // NEW: play wrong sound
      void wrongSound.play().catch(() => {});
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) setTimeout(() => setStatus("lost"), 250);
        return next;
      });
      setTimeout(() => setSelectedByLang({}), 400);
    }
  }

  // Helper: how many unmatched remain after marking ids matched
  function prevRemainingAfterMark(list: Card[], matchedIds: string[]) {
    const matchedSet = new Set(matchedIds);
    let count = 0;
    for (const c of list) {
      if (matchedSet.has(c.id)) continue;
      if (!c.matched) count++;
    }
    // subtract the two just matched (they weren't matched before this call)
    return count;
  }

  function newRound() {
    setRound(r => r + 1);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Seo
        title="AraBuddy – Learn Quranic Arabic (Word Matching) | AyahVault"
        description="Match Arabic–English word pairs from Quranic vocabulary. Timed rounds, limited lives, and satisfying effects to keep learning fun."
        canonical="https://ayahvault.com/arabuddy"
        ogTitle="AraBuddy – Learn Quranic Arabic"
        ogDescription="Practice Quranic vocabulary with a simple matching game."
        ogImage="https://ayahvault.com/og/arabuddy.png"
        ogUrl="https://ayahvault.com/arabuddy"
        keywords="learn Quranic Arabic, Arabic vocabulary, Arabic matching game"
      />
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-center text-3xl font-bold text-purple-700">AraBuddy - Learn Quranic Arabic</h1>
      </div>

      {/* Lives + New Round (HIDDEN when game is over) */}
      {!isOver && (
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
      )}

      {/* Themed loading & error panels */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Spinner
            message=""
            colorClassName="text-purple-600"
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
          {isOver ? (
            // End-of-round panel inside the game box
            <div className="flex min-h-[12rem] flex-col items-center justify-center text-center">
              {status === "won" ? (
                <p className="text-2xl font-extrabold text-green-600">
                  Congratulations, you passed this round.
                </p>
              ) : (
                <p className="text-2xl font-extrabold text-rose-600">
                  Round over.
                </p>
              )}

              {typeof elapsedMs === "number" && (
                <p className="mt-2 text-slate-600">
                  Time: <span className="font-semibold">{fmtMs(elapsedMs)}</span>
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={newRound}
                  className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
                >
                  New Game
                </button>
                <button
                  onClick={() => navigate("/")}
                  className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Back to Home
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" aria-label="Matching cards grid">
                {cards.map(card => {
                  const isSelected =
                    (card.lang === "en" && selectedByLang.en === card.id) ||
                    (card.lang === "ar" && selectedByLang.ar === card.id);
                  const isFlashingCorrect = flashCorrectIds.has(card.id); // green phase
                  const isFading = fadingIds.has(card.id);                 // fade phase

                  return (
                    <button
                      key={card.id}
                      onClick={() => toggleSelect(card.id)}
                      disabled={isFading || isOver || card.matched} // block clicks while fading or matched
                      className={[
                        "relative h-24 rounded-xl border text-center transition",
                        "flex items-center justify-center px-2",
                        // Keep space: when matched or fading, only change opacity (don't change size/margins)
                        (isFading || card.matched)
                          ? "opacity-0 transition-opacity duration-500 ease-out pointer-events-none border-transparent bg-transparent"
                          : "opacity-100 transition-opacity duration-150",
                        // Flash green on correct
                        isFlashingCorrect
                          ? "bg-green-500 text-white border-green-600"
                          : isSelected
                          ? "border-purple-600 bg-purple-600 text-white animate-vibrate"
                          : "border-slate-200 hover:bg-purple-50",
                        status === "wrong" && isSelected ? "bg-red-500 text-white" : "",
                        status === "correct" && isSelected && !isFlashingCorrect
                          ? "animate-pop border-green-500"
                          : "",
                      ].join(" ")}
                      aria-pressed={isSelected}
                      aria-label={`${card.lang === "ar" ? "Arabic" : "English"} card`}
                      dir={card.lang === "ar" ? "rtl" : "ltr"}
                    >
                      <span className="text-sm sm:text-base md:text-lg font-medium select-none">
                        {card.label}
                      </span>
                      <span className="absolute right-2 top-2 text-[10px] text-purple-200">
                        {card.lang.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Controls under grid */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  Remaining: <span className="font-semibold">{remaining}</span> · Selected:{" "}
                  <span className="font-semibold">
                    {Number(Boolean(selectedByLang.en)) + Number(Boolean(selectedByLang.ar))}
                  </span>
                </div>

                <button
                  onClick={handleMatch}
                  disabled={!canMatch}
                  className={[
                    "rounded-lg px-4 py-2 font-semibold transition",
                    canMatch
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed",
                  ].join(" ")}
                  title="Press Enter to match"
                >
                  Match
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
