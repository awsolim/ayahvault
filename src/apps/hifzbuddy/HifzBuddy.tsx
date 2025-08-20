// src/apps/hifzbuddy/HifzBuddy.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import Footer from "../../components/layout/Footer";
import Spinner from "../../components/ui/Spinner";
import Seo from "../../lib/Seo";

// ---- bring in the typed qviews you already split out ----
import WhichSurah from "./qviews/WhichSurah";
import NextVerse from "./qviews/NextVerse";
import FillBlank from "./qviews/FillBlank";
import BeforeAfter from "./qviews/BeforeAfter";
import Match2x2 from "./qviews/Match2x2";
import SortColumns from "./qviews/SortColumns";
import SpotDiff from "./qviews/SpotDiff";
import LocationMCQ from "./qviews/LocationMCQ";

// all qtypes live here (typed)
import type { AnyQ } from "./qtypes";

type Phase = "loading" | "ready" | "transitioning" | "finished" | "error";

// Shape of a row coming back from Supabase (typed so `r` isn't any)
type DBRow = {
  id: number;
  qtype: AnyQ["qtype"];
  prompt: unknown;   // may be string or JSON
  payload: unknown;  // JSON
  answer: unknown;   // JSON
  tags: string[] | null;
  difficulty: number | null;
  active: boolean | null;
};

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const safeParse = (x: unknown) => {
  if (x == null) return x;
  if (typeof x === "string") {
    try {
      return JSON.parse(x);
    } catch {
      return x;
    }
  }
  return x;
};

export default function HifzBuddy() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [rows, setRows] = useState<AnyQ[]>([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  // sounds
  const sCorrect = useRef<HTMLAudioElement | null>(null);
  const sWrong = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    sCorrect.current = new Audio("/audio/correct.mp3");
    sWrong.current = new Audio("/audio/wrong.mp3");
    sCorrect.current.preload = "auto";
    sWrong.current.preload = "auto";
  }, []);

  // load from public.hifzbuddy
  useEffect(() => {
  let cancelled = false;
  (async () => {
    setPhase("loading");
    setErr(null);

    const { data, error } = await supabase
      .from("hifzbuddy") // ⬅️ no generic here
      .select("id, qtype, prompt, payload, answer, tags, difficulty, active")
      .eq("active", true)
      .order("difficulty", { ascending: true });

    if (cancelled) return;

    if (error) {
      setErr(error.message || "Could not load questions.");
      setPhase("error");
      return;
    }

    const rows = (data ?? []) as DBRow[]; // ⬅️ cast the result

    const list: AnyQ[] = rows.map((r) => ({
      id: r.id,
      qtype: r.qtype,
      prompt: safeParse(r.prompt),
      payload: safeParse(r.payload),
      answer: safeParse(r.answer),
      tags: r.tags ?? undefined,
      difficulty: r.difficulty ?? undefined,
    }));

    if (!list.length) {
      setErr("No questions found in public.hifzbuddy.");
      setPhase("error");
      return;
    }

    setRows(shuffle(list));
    setIdx(0);
    setScore(0);
    setPhase("ready");
  })();

  return () => {
    cancelled = true;
  };
}, []);
  const current = rows[idx] ?? null;
  const total = rows.length;
  const progressPct = useMemo(
    () => (total ? Math.round(((idx + 1) / total) * 100) : 0),
    [idx, total]
  );

  function advance() {
    if (idx + 1 >= rows.length) {
      setPhase("finished");
      return;
    }
    setIdx((i) => i + 1);
    setPhase("ready");
  }

  async function onGrade(correct: boolean) {
    try {
      if (correct) {
        if (sCorrect.current) {
          sCorrect.current.currentTime = 0;
          await sCorrect.current.play();
        }
      } else {
        if (sWrong.current) {
          sWrong.current.currentTime = 0;
          await sWrong.current.play();
        }
      }
    } catch {}
    if (correct) setScore((s) => s + 1);
    setPhase("transitioning");
    setTimeout(() => advance(), correct ? 350 : 450);
  }

  return (
    <div className="min-h-screen flex flex-col items-center">
      {/* tiny local animations */}
      <style>{`
        @keyframes hzb-shake {0%,100%{transform:translateX(0)} 25%{transform:translateX(-2px)} 75%{transform:translateX(2px)}}
        .hzb-shake { animation: hzb-shake 320ms ease-in-out 1; }
        .hzb-slide-out { transform: translateX(-12px); opacity: 0; transition: transform 180ms ease-out, opacity 180ms ease-out; }
      `}</style>

      <Seo
        title="HifzBuddy – Mutashabihat Trainer | AyahVault"
        description="Red-themed Mutashabihat drills — multiple question types."
        canonical="https://ayahvault.com/hifzbuddy"
      />

      {/* Header */}
      <div className="w-full max-w-3xl px-4 pt-6 pb-2 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-red-700">HifzBuddy — Mutashabihat</h1>
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
            className={[
              "rounded-2xl bg-white p-5 ring-1 ring-slate-200",
              phase === "transitioning" ? "hzb-slide-out" : "",
            ].join(" ")}
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

            <QuestionView q={current} onGrade={onGrade} />
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
                  setRows((r) => shuffle(r));
                  setIdx(0);
                  setScore(0);
                  setPhase("ready");
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

/* ---------------------------
   Render the proper qview
--------------------------- */
function QuestionView({
  q,
  onGrade,
}: {
  q: AnyQ;
  onGrade: (ok: boolean) => void;
}) {
  switch (q.qtype) {
    case "which_surah":  return <WhichSurah  q={q as any} onGrade={onGrade} />;
    case "next_verse":   return <NextVerse   q={q as any} onGrade={onGrade} />;
    case "fill_blank":   return <FillBlank   q={q as any} onGrade={onGrade} />;
    case "before_after": return <BeforeAfter q={q as any} onGrade={onGrade} />;
    case "match_2x2":    return <Match2x2    q={q as any} onGrade={onGrade} />;
    case "sort_columns": return <SortColumns q={q as any} onGrade={onGrade} />;
    case "spot_diff":    return <SpotDiff    q={q as any} onGrade={onGrade} />;
    case "location":     return <LocationMCQ q={q as any} onGrade={onGrade} />;
    default:             return <div>Unsupported question type.</div>;
  }
}
