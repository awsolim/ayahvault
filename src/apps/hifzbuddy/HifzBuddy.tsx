// src/apps/hifzbuddy/HifzBuddy.tsx
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import Footer from "../../components/layout/Footer";
import Spinner from "../../components/ui/Spinner";
import Seo from "../../lib/Seo";

type ChoiceKey = "a" | "b" | "c" | "d";
type HifzRow = {
  id?: string | number;
  question: string;
  a: string; b: string; c: string; d: string;
  answer: string; // 'a' | 'b' | 'c' | 'd'
};

type Phase = "loading" | "ready" | "transitioning" | "finished" | "error";

const ORDER: ChoiceKey[] = ["a", "b", "c", "d"];
const keyFromIndex = (i: number): ChoiceKey => ORDER[(i % 4 + 4) % 4];

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HifzBuddy() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rows, setRows] = useState<HifzRow[]>([]);
  const [idx, setIdx] = useState(0);

  // selection: the single, persistent RED-selected index (0..3) or null
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  // transient feedback
  const [flashCorrect, setFlashCorrect] = useState<ChoiceKey | null>(null);
  const [flashWrong, setFlashWrong] = useState<ChoiceKey | null>(null);

  const [score, setScore] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // sounds
  const sCorrect = useRef<HTMLAudioElement | null>(null);
  const sWrong   = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    sCorrect.current = new Audio("/audio/correct.mp3");
    sWrong.current   = new Audio("/audio/wrong.mp3");
    if (sCorrect.current) sCorrect.current.preload = "auto";
    if (sWrong.current)   sWrong.current.preload   = "auto";
  }, []);

  // focusable container to catch keyboard arrows reliably
  const focusRef = useRef<HTMLDivElement | null>(null);
  const focusCard = useCallback(() => {
    requestAnimationFrame(() => {
      focusRef.current?.focus();
    });
  }, []);

  // load questions
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setPhase("loading");
      setErr(null);
      const { data, error } = await supabase
        .from("hifzbuddy")
        .select("id, question, a, b, c, d, answer");

      if (cancelled) return;

      if (error) {
        console.error("[HifzBuddy] load error:", error?.message ?? error);
        setErr("Could not load questions. Please try again.");
        setPhase("error");
        return;
      }
      const list = (data as HifzRow[]).map(r => ({
        ...r,
        answer: String(r.answer ?? "").trim().toLowerCase(),
      }));
      if (!list.length) {
        setErr('No questions found in "hifzbuddy".');
        setPhase("error");
        return;
      }

      setRows(shuffle(list));
      setIdx(0);
      setSelectedIdx(null);
      setFlashCorrect(null);
      setFlashWrong(null);
      setScore(0);
      setPhase("ready");
      focusCard();
    })();
    return () => { cancelled = true; };
  }, [focusCard]);

  // refocus each time we advance to keep arrow keys working
  useEffect(() => {
    if (phase === "ready") focusCard();
  }, [phase, idx, focusCard]);

  const current = rows[idx] ?? null;
  const total = rows.length;
  const progressPct = useMemo(
    () => (total ? Math.round(((idx + 1) / total) * 100) : 0),
    [idx, total]
  );

  // ====== keyboard on the card: arrows move RED selection; Enter submits ======
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (phase !== "ready") return;

    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      setSelectedIdx(prev => (prev === null ? 0 : (prev + 1) % 4));
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      setSelectedIdx(prev => (prev === null ? 3 : (prev + 3) % 4));
    } else if (e.key === "Enter") {
      if (selectedIdx !== null) {
        e.preventDefault();
        handleSubmit();
      }
    }
  };

  // click to select (set/stick RED background)
  function selectByClick(_k: ChoiceKey, i: number) {
    if (phase !== "ready") return;
    setSelectedIdx(i);
    focusCard(); // keep keyboard nav alive after clicking
  }

  function handleSubmit() {
    if (phase !== "ready" || selectedIdx === null || !current) return;
    const chosenKey = keyFromIndex(selectedIdx);
    const isCorrect = chosenKey === current.answer;

    if (isCorrect) {
      setFlashCorrect(chosenKey);
      setScore(s => s + 1);
      try { sCorrect.current && (sCorrect.current.currentTime = 0, sCorrect.current.play()); } catch {}
      setTimeout(() => {
        setPhase("transitioning"); // slide out
        setTimeout(() => advance(), 180); // slide duration
      }, 320); // green shake duration
    } else {
      setFlashWrong(chosenKey);
      try { sWrong.current && (sWrong.current.currentTime = 0, sWrong.current.play()); } catch {}
      // keep your red selection; just clear the deeper flash shortly
      setTimeout(() => setFlashWrong(null), 420);
    }
  }

  function advance() {
    if (idx + 1 >= rows.length) {
      setPhase("finished");
      return;
    }
    setIdx(i => i + 1);
    setSelectedIdx(null);
    setFlashCorrect(null);
    setFlashWrong(null);
    setPhase("ready");
  }

  // single choice button (with clear visual precedence)
  const choiceBtn = (k: ChoiceKey, i: number) => {
    const label = current ? current[k] : "";
    const isSelected = selectedIdx === i;   // SOLID red (click or arrows)
    const isCorrect  = flashCorrect === k;  // temporary green + shake
    const isWrong    = flashWrong === k;    // temporary deeper red

    // precedence: CORRECT → WRONG → SELECTED → HOVER
    let variantClass = "";
    if (isCorrect) {
      variantClass = "bg-emerald-500 text-white ring-emerald-600 hzb-shake";
    } else if (isWrong) {
      variantClass = "bg-red-900 text-white ring-red-900";
    } else if (isSelected) {
      variantClass = "bg-rose-100 ring-rose-300";
    } else {
      variantClass = "hover:bg-rose-50";
    }

    return (
      <button
        key={k}
        onClick={() => selectByClick(k, i)}
        disabled={phase !== "ready"}
        aria-selected={isSelected}
        className={[
          "w-full text-left px-4 py-3 rounded-xl ring-1 transition relative",
          variantClass,
        ].join(" ")}
      >
        <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 ring-slate-300 font-bold">
          {k.toUpperCase()}
        </span>
        <span className="align-middle">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* tiny local animations */}
      <style>{`
        @keyframes hzb-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-2px)} 75%{transform:translateX(2px)} }
        .hzb-shake { animation: hzb-shake 320ms ease-in-out 1; }
        .hzb-slide-out { transform: translateX(-12px); opacity: 0; transition: transform 180ms ease-out, opacity 180ms ease-out; }
      `}</style>

      <Seo
        title="HifzBuddy – Mutashabihat Trainer | AyahVault"
        description="Red-themed Mutashabihat drills. Click to select, arrows to move selection, Enter/Submit to check."
        canonical="https://ayahvault.com/hifzbuddy"
        ogTitle="HifzBuddy – Mutashabihat Trainer"
        ogDescription="Quick multiple-choice Mutashabihat practice from Supabase."
        ogImage="https://ayahvault.com/og/hifzbuddy.png"
        ogUrl="https://ayahvault.com/hifzbuddy"
        keywords="Hifz, Mutashabihat, Quran memorization, complete the verse"
      />

      {/* Header (red theme, no extra Home button) */}
      <div className="w-full max-w-3xl px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-red-700">HifzBuddy — Complete the Verse</h1>
        {phase !== "loading" && phase !== "error" && (
          <div className="text-sm text-slate-600">{idx + 1} / {total}</div>
        )}
      </div>

      <div className="w-full max-w-3xl px-4 pb-8">
        {phase === "loading" && (
          <div className="h-64 grid place-items-center rounded-2xl bg-white ring-1 ring-slate-200">
            <Spinner />
          </div>
        )}

        {phase === "error" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-red-700">{err ?? "Something went wrong."}</p>
          </div>
        )}

        {(phase === "ready" || phase === "transitioning") && current && (
          <div
            ref={focusRef}
            tabIndex={0}
            role="application"
            onKeyDown={onKeyDown}
            className={[
              "rounded-2xl bg-white p-5 ring-1 ring-slate-200 outline-none",
              phase === "transitioning" ? "hzb-slide-out" : "",
            ].join(" ")}
            onClick={focusCard}
          >
            {/* progress (orange -> red gradient) */}
            <div className="mb-5">
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 via-red-500 to-rose-600"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Score: <span className="font-semibold">{score}</span> / {total}
              </div>
            </div>

            {/* question */}
            <div className="mb-5">
              <p className="text-lg md:text-xl font-semibold text-gray-900">
                {current.question}
              </p>
              <p className="mt-1 text-xs text-slate-500">(Complete the verse)</p>
            </div>

            {/* choices */}
            <div className="grid gap-3" role="listbox" aria-label="Answer choices">
              {ORDER.map((k, i) => choiceBtn(k, i))}
            </div>

            {/* actions */}
            <div className="mt-6 flex items-center justify-end">
              <button
                onClick={handleSubmit}
                disabled={selectedIdx === null || phase !== "ready"}
                className={[
                  "rounded-lg px-4 py-2 font-semibold transition",
                  selectedIdx !== null && phase === "ready"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-slate-200 text-slate-500 cursor-not-allowed",
                ].join(" ")}
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {phase === "finished" && (
          <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 text-center">
            <p className="text-2xl font-extrabold text-red-600">All done!</p>
            <p className="mt-2 text-slate-700">
              Final score: <span className="font-semibold">{score}</span> / {total}
            </p>
            <div className="mt-5">
              <button
                onClick={() => {
                  setRows(r => shuffle(r));
                  setIdx(0);
                  setSelectedIdx(null);
                  setFlashCorrect(null);
                  setFlashWrong(null);
                  setScore(0);
                  setPhase("ready");
                  focusCard();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              >
                Restart (Shuffle)
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
