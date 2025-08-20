import { useState } from "react";
import type { QBeforeAfter } from "../qtypes";

type Props = { q: QBeforeAfter; onGrade: (ok: boolean) => void };

export default function BeforeAfter({ q, onGrade }: Props) {
  const P = typeof q.prompt === "string" ? { anchor: q.prompt, token: "" } : q.prompt;
  const [sel, setSel] = useState<"before" | "after" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const correct = sel != null && sel === q.answer.side;

  const cls = (side: "before" | "after") => [
    "w-full text-right px-4 py-3 rounded-xl ring-1 transition ring-slate-300",
    sel === side ? "bg-rose-100 ring-rose-300" : "hover:bg-rose-50",
    submitted && side === q.answer.side ? "bg-emerald-200 ring-emerald-400 hzb-shake" : "",
    submitted && sel === side && side !== q.answer.side ? "bg-red-900 text-white ring-red-900" : "",
  ].join(" ");

  return (
    <div dir="rtl">
      <p className="text-lg font-semibold mb-2">هل "{P.token}" قبل أم بعد:</p>
      <p className="mb-4">{P.anchor}</p>
      <div className="grid grid-cols-2 gap-3">
        {(["before", "after"] as const).map((side) => (
          <button key={side} onClick={() => setSel(side)} className={cls(side)}>
            {side === "before" ? "قبل" : "بعد"}
          </button>
        ))}
      </div>
      <div className="mt-4 text-right">
        <button
          disabled={!sel}
          onClick={() => { if (sel) { setSubmitted(true); onGrade(correct); } }}
          className={`rounded-lg px-4 py-2 font-semibold ${!sel ? "bg-slate-200 text-slate-500" : "bg-red-600 text-white hover:bg-red-700"}`}
        >Submit</button>
      </div>
    </div>
  );
}
