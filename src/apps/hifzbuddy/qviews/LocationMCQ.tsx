import { useState } from "react";
import type { QLocation } from "../qtypes";

type Props = { q: QLocation; onGrade: (ok: boolean) => void };

export default function LocationMCQ({ q, onGrade }: Props) {
  const [sel, setSel] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const options: { surah: string; ayah?: string }[] = q.payload.options;   // 👈 typed
  const correct = sel !== null && sel === q.answer.index;

  const cls = (i: number) => [
    "w-full text-right px-4 py-3 rounded-xl ring-1 transition ring-slate-300",
    sel === i ? "bg-rose-100 ring-rose-300" : "hover:bg-rose-50",
    submitted && i === q.answer.index ? "bg-emerald-200 ring-emerald-400 hzb-shake" : "",
    submitted && sel === i && i !== q.answer.index ? "bg-red-900 text-white ring-red-900" : "",
  ].join(" ");

  return (
    <div dir="rtl">
      <p className="text-lg font-semibold mb-4">{q.prompt}</p>
      <div className="grid gap-3">
        {options.map((opt, i) => (
          <button key={i} onClick={() => setSel(i)} className={cls(i)}>
            {opt.surah}{opt.ayah ? ` — ${opt.ayah}` : ""}
          </button>
        ))}
      </div>
      <div className="mt-4 text-right">
        <button
          disabled={sel === null}
          onClick={() => { if (sel !== null) { setSubmitted(true); onGrade(correct); } }}
          className={`rounded-lg px-4 py-2 font-semibold ${sel===null ? "bg-slate-200 text-slate-500" : "bg-red-600 text-white hover:bg-red-700"}`}
        >Submit</button>
      </div>
    </div>
  );
}
