// src/components/layout/ReviewsForm.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Star } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ReviewsForm() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [state, setState] = useState<FormState>("idle");
  const [errMsg, setErrMsg] = useState("");

  const isSubmitting = state === "submitting";
  const isSuccess = state === "success";
  const canSubmit =
    stars >= 1 && !!title.trim() && !!review.trim() && review.length <= 250;

  function validate(): string | null {
    if (stars < 1 || stars > 5) return "Please choose a star rating (1–5).";
    if (!title.trim()) return "Please add a short title.";
    if (!review.trim()) return "Please add a review.";
    if (review.length > 250) return "Review must be at most 250 characters.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");
    const v = validate();
    if (v) return setErrMsg(v);

    setState("submitting");
    const safeName = name.trim() || "Anonymous";
    const { error } = await supabase.from("reviews").insert({
      name: safeName,
      title: title.trim(),
      review: review.trim(),
      stars,
    });

    if (error) {
      setState("error");
      setErrMsg(error.message || "Submission failed. Please try again.");
      return;
    }

    setState("success");
    setTimeout(() => {
      setState("idle");
      setName(""); setTitle(""); setReview("");
      setStars(0); setHoverStars(0); setErrMsg("");
    }, 2500);
  }

  function StarButton({ value }: { value: number }) {
    const filled = (hoverStars || stars) >= value;
    return (
      <button
        type="button"
        aria-label={`Rate ${value} ${value === 1 ? "star" : "stars"}`}
        className="p-0.5"
        onMouseEnter={() => setHoverStars(value)}
        onMouseLeave={() => setHoverStars(0)}
        onFocus={() => setHoverStars(value)}
        onBlur={() => setHoverStars(0)}
        onClick={() => setStars(value)}
      >
        <Star
          className={`h-5 w-5 transition ${
            filled ? "fill-yellow-400 stroke-yellow-500" : "stroke-gray-400"
          }`}
        />
      </button>
    );
  }

  return (
    <section
      aria-labelledby="reviews-heading"
      className="w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2
        id="reviews-heading"
        className="text-center text-lg font-semibold text-slate-800 mb-5"
      >
        Leave feedback
      </h2>

      {/* Clean 3×2 grid on md+; simple, consistent spacing */}
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-5"
      >
        {/* COL 1, ROW 1 — Name */}
        <div className="md:col-start-1 md:row-start-1">
          <label className="block text-xs font-medium text-slate-700">
            Name <span className="text-slate-400">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonymous"
            maxLength={60}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* COL 1, ROW 2 — Title */}
        <div className="md:col-start-1 md:row-start-2">
          <label className="block text-xs font-medium text-slate-700">
            Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* COL 2, ROW 1–2 — Review */}
        <div className="ml-4 md:col-start-2 md:row-start-1 md:row-span-2">
          <label className="block text-xs font-medium text-slate-700">
            Review <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            required
            maxLength={250}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 h-28 md:h-32 resize-vertical outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="What did you like? Any suggestions?"
          />
          <div className="mt-1 text-[11px] text-slate-500 text-right">
            {review.length}/250
          </div>
        </div>

        {/* COL 3, ROW 1 — Rating */}
        <div className="md:col-start-3 md:row-start-1">
          <label className="block text-xs font-medium text-slate-700">
            Rating <span className="text-rose-500">*</span>
          </label>
          <div className="mt-2 ml-16 flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <StarButton key={v} value={v} />
              ))}
            </div>
          </div>
        </div>

        {/* COL 3, ROW 2 — Submit */}
        <div className="md:col-start-3 md:row-start-2">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting || isSuccess}
            className={`rounded-lg px-6 py-2 font-semibold transition
              ${isSuccess
                ? "bg-emerald-500 text-white"
                : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}
          >
            {isSubmitting ? "Submitting…" : isSuccess ? "Submitted" : "Submit"}
          </button>
        </div>

        {/* Error line (full width) */}
        {errMsg && (
          <div className="md:col-span-3 -mt-1 text-center text-sm text-rose-600">
            {errMsg}
          </div>
        )}
      </form>
    </section>
  );
}
