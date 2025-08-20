import { useState } from "react";
import type { QSortColumns } from "../qtypes";

type Props = { q: QSortColumns; onGrade: (ok: boolean) => void };
type SortItem = { id: number; text: string; col: 0 | 1; drop?: 0 | 1 };

export default function SortColumns({ q, onGrade }: Props) {
  const [A, B] = q.payload.columns as [string, string];
  const seed: SortItem[] = (q.payload.items as { text: string; col: 0|1 }[])
    .map((x, i) => ({ id: i, text: x.text, col: x.col }));
  const [items, setItems] = useState<SortItem[]>(seed);
  const [submitted, setSubmitted] = useState(false);

  const allDropped = items.every(x => x.drop === 0 || x.drop === 1);

  function toA(id: number) { if (!submitted) setItems(ls => ls.map(x => x.id===id ? { ...x, drop: 0 } : x)); }
  function toB(id: number) { if (!submitted) setItems(ls => ls.map(x => x.id===id ? { ...x, drop: 1 } : x)); }

  function submit() {
    const ok = items.every(x => x.drop === x.col);
    setSubmitted(true);
    onGrade(ok);
  }

  return (
    <div dir="rtl">
      <p className="text-lg font-semibold mb-3">{q.prompt}</p>
      <div className="grid grid-cols-2 gap-4">
        <Column title={A} items={items.filter(x => x.drop===0)} />
        <Column title={B} items={items.filter(x => x.drop===1)} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        {items.filter(x => x.drop!==0 && x.drop!==1).map(x => (
          <div key={x.id} className="inline-flex items-center gap-2 ring-1 ring-slate-300 rounded-lg px-2 py-1 bg-white">
            <span className="text-sm">{x.text}</span>
            <button onClick={() => toA(x.id)} className="text-xs rounded bg-rose-50 px-2 py-1 hover:bg-rose-100">{A}</button>
            <button onClick={() => toB(x.id)} className="text-xs rounded bg-rose-50 px-2 py-1 hover:bg-rose-100">{B}</button>
          </div>
        ))}
      </div>
      <div className="mt-4 text-right">
        <button disabled={!allDropped || submitted} onClick={submit}
          className={`rounded-lg px-4 py-2 font-semibold ${!allDropped || submitted ? "bg-slate-200 text-slate-500" : "bg-red-600 text-white hover:bg-red-700"}`}>
          Submit
        </button>
      </div>
    </div>
  );
}

function Column({ title, items }: { title: string; items: SortItem[] }) {
  return (
    <div className="rounded-xl ring-1 ring-slate-200 p-3">
      <p className="text-sm font-semibold mb-2">{title}</p>
      <div className="space-y-2">
        {items.map(x => (
          <span key={x.id} className="block text-right px-3 py-2 rounded-lg ring-1 ring-slate-300 bg-white">{x.text}</span>
        ))}
      </div>
    </div>
  );
}
