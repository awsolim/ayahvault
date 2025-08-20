import { useState } from "react";
import type { QSpotDiff } from "../qtypes";

type Props = { q: QSpotDiff; onGrade: (ok: boolean) => void };

export default function SpotDiff({ q, onGrade }: Props) {
  const A: string[] = q.payload.A_tokens;
  const B: string[] = q.payload.B_tokens;
  const needed = new Set<number>(q.answer.diffIndices);
  const [hits, setHits] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggle = (i: number) => { if (!submitted) setHits(h => h.includes(i) ? h.filter(x=>x!==i) : [...h, i]); };
  const submit = () => {
    const ok = hits.length === needed.size && hits.every(i => needed.has(i));
    setSubmitted(true);
    onGrade(ok);
  };

  return (
    <div dir="rtl">
      <p className="text-lg font-semibold mb-3">{q.prompt}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Line tokens={A} hits={hits} submitted={submitted} onClick={toggle} />
        <Line tokens={B} hits={hits} submitted={submitted} onClick={toggle} />
      </div>
      <div className="mt-4 text-right">
        <button onClick={submit} className="rounded-lg px-4 py-2 font-semibold bg-red-600 text-white hover:bg-red-700">Submit</button>
      </div>
    </div>
  );
}

function Line({ tokens, hits, submitted, onClick }:{
  tokens: string[]; hits: number[]; submitted: boolean; onClick: (i:number)=>void;
}) {
  return (
    <div className="flex flex-wrap gap-1 ring-1 ring-slate-200 rounded-lg p-2 bg-white">
      {tokens.map((t, i) => (
        <button key={i}
          className={[
            "px-2 py-1 rounded",
            hits.includes(i) ? "bg-rose-100 ring-1 ring-rose-300" : "hover:bg-rose-50",
            submitted && hits.includes(i) ? "bg-emerald-200 ring-emerald-400 hzb-shake" : "",
          ].join(" ")}
          onClick={() => onClick(i)}>{t}</button>
      ))}
    </div>
  );
}
