// src/components/ReviewsForm.tsx
// Horizontal 3-column feedback form wired to Supabase (v2).
// Name is optional (defaults to "Anonymous"); Title, Stars, and Review are required.
// Review max length is 250. After successful submit, the button turns green and
// is disabled for ~3s, then the form resets.

// NEW: React state for form + UX flags
import { useState } from "react";
// NEW: Supabase client (you already have this file)
import { supabase } from "../../lib/supabaseClient";
// NEW: Star icon for rating UI (you already use lucide-react)
import { Star } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ReviewsForm() {
  // NEW: controlled fields
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);

  // NEW: form status + error
  const [state, setState] = useState<FormState>("idle");
  const [errMsg, setErrMsg] = useState("");

  // NEW: convenience flags (also quiets TS “unintentional comparison” warnings)
  const isSubmitting = state === "submitting";
  const isSuccess = state === "success";

  // NEW: client-side validation to avoid useless round trips
  function validate(): string | null {
    if (stars < 1 || stars > 5) return "Please choose a star rating (1–5).";
    if (!title.trim()) return "Please add a short title.";
    if (!review.trim()) return "Please add a review.";
    if (review.length > 250) return "Review must be at most 250 characters.";
    return null;
  }

  // NEW: submit handler — inserts a row into public.reviews
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg("");

    const v = validate();
    if (v) {
      setErrMsg(v);
      return;
    }

    setState("submitting");

    // NEW: default anonymous name if left blank
    const safeName = name.trim() || "Anonymous";

    // IMPORTANT: supabase-js v2 returns minimal by default.
    // Do NOT pass { returning: 'minimal' } — that option is not used in v2 types.
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

    // NEW: success UX — lock the button green for ~3s, then reset the form
    setState("success");
    setTimeout(() => {
      setState("idle");
      setName("");
      setTitle("");
      setReview("");
      setStars(0);
      setHoverStars(0);
      setErrMsg("");
    }, 3000);
  }

  // NEW: reusable star button (hover preview + click select)
  function StarButton({ value }: { value: number }) {
    const filled = (hoverStars || stars) >= value;
    return (
      <button
        type="button"
        aria-label={`Rate ${value} ${value === 1 ? "star" : "stars"}`}
        className="p-1"
        onMouseEnter={() => setHoverStars(value)}
        onMouseLeave={() => setHoverStars(0)}
        onFocus={() => setHoverStars(value)}
        onBlur={() => setHoverStars(0)}
        onClick={() => setStars(value)}
      >
        <Star
          className={`h-6 w-6 transition ${
            filled ? "fill-yellow-400 stroke-yellow-500" : "stroke-gray-400"
          }`}
        />
      </button>
    );
  }

  // NEW: compute submit enabled state (all required fields satisfied)
  const canSubmit =
    stars >= 1 && !!title.trim() && !!review.trim() && review.length <= 250;

  return (
    <section
      aria-labelledby="reviews-heading"
      className="w-full max-w-6xl mx-auto rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-sm backdrop-blur"
    >
      <h2 id="reviews-heading" className="text-center text-lg font-semibold mb-6">
        Leave feedback
      </h2>

      {/* NEW: horizontal layout — 3 columns on md+, stacks on mobile */}
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* COLUMN 1 — Name (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Anonymous" // requirement: placeholder shows "Anonymous"
            maxLength={60}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* COLUMN 2 — Title (required) + Stars (required) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((v) => (
                <StarButton key={v} value={v} />
              ))}
              <span className="ml-2 text-sm text-gray-600">
                {stars ? `${stars}/5` : "Select 1–5"}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMN 3 — Review (required, <= 250 chars) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Review <span className="text-red-500">*</span>
          </label>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            required
            maxLength={250} // requirement: cap at 250
            rows={6}
            placeholder="What did you like? Any suggestions?"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="mt-1 text-xs text-gray-500">{review.length}/250</div>
        </div>

        {/* FULL-WIDTH ROW — Errors + Submit */}
        <div className="md:col-span-3">
          {errMsg && <p className="text-sm text-red-600 mb-3">{errMsg}</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit || isSubmitting || isSuccess}
              className={`rounded-lg px-6 py-2 font-semibold transition
                ${isSuccess
                  ? "bg-green-500 text-white"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"}`}
            >
              {isSubmitting ? "Submitting…" : isSuccess ? "Submitted" : "Submit"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
