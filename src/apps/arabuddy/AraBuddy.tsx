// src/apps/arabuddy/AraBuddy.tsx
import { useMemo, useState, useEffect } from "react";
// import { Link } from "react-router-dom";

type Lang = "en" | "ar";

type VocabPair = {
  id: string;
  en: string;
  ar: string;
};

type Card = {
  id: string;
  pairId: string;
  lang: Lang;
  label: string;
  matched: boolean;
};

// Starter vocab (feel free to expand later)
const VOCAB: VocabPair[] = [
  { id: "1", en: "Mercy",     ar: "رحمة" },
  { id: "2", en: "Guidance",  ar: "هدى" },
  { id: "3", en: "Light",     ar: "نور" },
  { id: "4", en: "Knowledge", ar: "علم" },
  { id: "5", en: "Patience",  ar: "صبر" },
  { id: "6", en: "Truth",     ar: "حق"  },
];

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
  // NEW: store selections by language so two EN or two AR are never “both selected”
  const [selectedByLang, setSelectedByLang] = useState<{ en?: string; ar?: string }>({}); // { en: cardId?, ar: cardId? }
  const [cards, setCards] = useState<Card[]>([]);
  const [lives, setLives] = useState<number>(3);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong" | "won" | "lost">("idle");
  const [round, setRound] = useState<number>(1);

  // Build a fresh deck each round
  useEffect(() => {
    // Create AR then EN cards so AR will render first in the grid (top rows),
    // then EN will follow (bottom rows). We still shuffle *within* each language
    // to avoid the same order each round.
    const arCards: Card[] = shuffle(
      VOCAB.map(p => ({ id: `${p.id}-ar`, pairId: p.id, lang: "ar", label: p.ar, matched: false }))
    );
    const enCards: Card[] = shuffle(
      VOCAB.map(p => ({ id: `${p.id}-en`, pairId: p.id, lang: "en", label: p.en, matched: false }))
    );

    // NEW: Concatenate AR (top) then EN (bottom) to enforce lane separation visually
    setCards([...arCards, ...enCards]);
    setSelectedByLang({});
    setLives(3);
    setStatus("idle");
  }, [round]);

  const remaining = useMemo(() => cards.filter(c => !c.matched).length, [cards]);

  // NEW: selecting cards respects language lanes — selecting another of the same language replaces the old one
  function toggleSelect(id: string) {
    const card = cards.find(c => c.id === id);
    if (!card || card.matched || status === "won" || status === "lost") return;
    setStatus("idle");

    setSelectedByLang(prev => {
      // If clicked the same card again → unselect it
      if ((card.lang === "en" && prev.en === id) || (card.lang === "ar" && prev.ar === id)) {
        const next = { ...prev };
        delete (next as any)[card.lang];
        return next;
        // ^ NEW: clicking again toggles off
      }
      // Otherwise, set the selection for that language (replacing any existing same-language pick)
      return { ...prev, [card.lang]: id };
    });
  }

  // Derived: do we have one EN and one AR selected?
  const enSel = selectedByLang.en ? cards.find(c => c.id === selectedByLang.en) : undefined;
  const arSel = selectedByLang.ar ? cards.find(c => c.id === selectedByLang.ar) : undefined;
  const canMatch = Boolean(enSel && arSel) && status !== "won" && status !== "lost";

  // NEW: Enter key triggers “Match”
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && canMatch) handleMatch();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canMatch, selectedByLang, cards, status]);

  function handleMatch() {
    // Need one EN and one AR selected
    if (!enSel || !arSel) return;

    const isCorrect = enSel.pairId === arSel.pairId; // NEW: only true EN↔AR with same pairId
    if (isCorrect) {
      setCards(prev =>
        prev.map(c =>
          c.id === enSel.id || c.id === arSel.id ? { ...c, matched: true } : c
        )
      );
      setSelectedByLang({});      // clear selections
      setStatus("correct");       // success animation class will apply to selected styles next render

      // Check for win after the two just got matched
      setTimeout(() => {
        const left = cards.filter(c => !c.matched && c.id !== enSel.id && c.id !== arSel.id).length;
        if (left === 0) setStatus("won");
        else setStatus("idle");
      }, 250);
    } else {
      setStatus("wrong");         // triggers shake/red style on selected
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          setTimeout(() => setStatus("lost"), 250);
        }
        return next;
      });
      // Auto-clear after short feedback
      setTimeout(() => setSelectedByLang({}), 400);
    }
  }

  function newRound() {
    setRound(r => r + 1);
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header: centered title; removed top-right Home button per your request */}
      <div className="mb-6">
        <h1 className="text-center text-3xl font-bold text-purple-700">AraBuddy</h1>
      </div>

      {/* Lives + New round controls aligned to the right, below the title */}
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

      {/* Status banners */}
      {status === "won" && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700">
          🎉 Great job! You matched all pairs.
        </div>
      )}
      {status === "lost" && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700">
          💡 Out of lives. Try a new round!
        </div>
      )}

      {/* NEW: White card behind the entire grid area */}
      <div className="rounded-2xl bg-white p-4 shadow-sm border border-slate-200">
        {/* Grid: AR cards (top), EN cards (bottom) because of how we constructed `cards` */}
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
                  // Selected: purple bg + white text + subtle vibration
                  isSelected
                    ? "border-purple-600 bg-purple-600 text-white animate-vibrate"
                    : "border-slate-200 hover:bg-purple-50",
                  // Wrong attempt feedback (brief): red tint for the selected cards
                  status === "wrong" && isSelected ? "bg-red-500 text-white" : "",
                  // Correct attempt feedback (brief): green pop for selected cards
                  status === "correct" && isSelected ? "animate-pop border-green-500" : ""
                ].join(" ")}
                aria-pressed={isSelected}
                aria-label={`${card.lang === "ar" ? "Arabic" : "English"} card`}
                dir={card.lang === "ar" ? "rtl" : "ltr"} // ensure Arabic renders RTL
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

        {/* Controls row (inside the white container) */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Remaining: <span className="font-semibold">{remaining}</span> &middot; Selected:{" "}
            <span className="font-semibold">{Number(Boolean(enSel)) + Number(Boolean(arSel))}</span>
          </div>

          <button
            onClick={handleMatch}
            disabled={!canMatch}
            className={[
              "rounded-lg px-4 py-2 font-semibold transition",
              canMatch ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-slate-200 text-slate-500 cursor-not-allowed"
            ].join(" ")}
            title="Press Enter to match"
          >
            Match
          </button>
        </div>
      </div>
    </div>
  );
}

