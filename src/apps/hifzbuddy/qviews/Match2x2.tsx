import { useState } from "react";
import type { QMatch2x2 } from "../qtypes";

type Props = { q: QMatch2x2; onGrade: (ok: boolean) => void };
type Pair = [number, number];

export default function Match2x2({ q, onGrade }: Props) {
  const left: string[] = q.payload.left;
  const right: string[] = q.payload.right;
  const [selL, setSelL] = useState<number | null>(null);
  const [pairs, setPairs] = useState<Pair[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function pickRight(r: number) {
    if (selL === null || submitted) return;
    const next: Pair[] = [...pairs, [selL, r]];
    setPairs(next);
    setSelL(null);
    if (next.length >= Math.min(left.length, right.length)) {
      setSubmitted(true);
      onGrade(equalPairs(next, q.answer.pairs));
    }
  }

  return (
    <div dir="rtl">
      <p className="text-lg font-semibold mb-4">{q.prompt}</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {left.map((t, i) => (
            <button
              key={i}
              onClick={() => !submitted && setSelL(i)}
              className={[
                "w-full text-right px-3 py-2 rounded-lg ring-1 ring-slate-300 transition",
                selL === i ? "bg-rose-100 ring-rose-300" : "hover:bg-rose-50",
                submitted && leftIsCorrect(i, pairs, q.answer.pairs) ? "bg-emerald-200 ring-emerald-400 hzb-shake" : "",
              ].join(" ")}
            >{t}</button>
          ))}
        </div>
        <div className="space-y-3">
          {right.map((t, i) => (
            <button
              key={i}
              onClick={() => pickRight(i)}
              className={[
                "w-full text-right px-3 py-2 rounded-lg ring-1 ring-slate-300 transition hover:bg-rose-50",
                submitted && rightIsCorrect(i, pairs, q.answer.pairs) ? "bg-emerald-200 ring-emerald-400 hzb-shake" : "",
              ].join(" ")}
            >{t}</button>
          ))}
        </div>
      </div>
      {!submitted && <p className="mt-3 text-sm text-slate-600">اختر آية (يسار) ثم اضغط السورة (يمين)</p>}
    </div>
  );
}

function equalPairs(a: Pair[], b: Pair[]) {
  const norm = (xs: Pair[]) => xs.slice().sort((p,q)=>p[0]-q[0]||p[1]-q[1]).map(x=>x.join(":")).join("|");
  return norm(a) === norm(b);
}
function leftIsCorrect(li: number, chosen: Pair[], answer: Pair[]) {
  const c = chosen.find(p => p[0] === li);
  return !!c && answer.some(p => p[0] === c[0] && p[1] === c[1]);
}
function rightIsCorrect(ri: number, chosen: Pair[], answer: Pair[]) {
  const c = chosen.find(p => p[1] === ri);
  return !!c && answer.some(p => p[0] === c[0] && p[1] === c[1]);
}
