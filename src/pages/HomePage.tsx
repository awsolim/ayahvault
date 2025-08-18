// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import ReviewsForm from "../components/layout/ReviewsForm";
import Seo from "../lib/Seo";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type AppRow = {
  id: number;
  title: string;
  description: string;
  theme: string | null;      // e.g. emerald, violet, red...
  image_url: string | null;  // expects anything; we'll normalize to /images/...
  show: boolean;
  order: number;
  router: string | null;
};

/** Theme color → text + hover classes (fallback to gray) */
const THEME: Record<
  string,
  { title: string; link: string; linkHover: string; cardHover: string }
> = {
  emerald: { title: "text-emerald-700", link: "text-emerald-600", linkHover: "hover:text-emerald-700", cardHover: "hover:bg-emerald-50" },
  blue:    { title: "text-blue-700",    link: "text-blue-600",    linkHover: "hover:text-blue-700",    cardHover: "hover:bg-blue-50" },
  violet:  { title: "text-violet-700",  link: "text-violet-600",  linkHover: "hover:text-violet-700",  cardHover: "hover:bg-violet-50" },
  purple:  { title: "text-purple-700",  link: "text-purple-600",  linkHover: "hover:text-purple-700",  cardHover: "hover:bg-purple-50" },
  red:     { title: "text-red-700",     link: "text-red-600",     linkHover: "hover:text-red-700",     cardHover: "hover:bg-red-50" },
  amber:   { title: "text-amber-700",   link: "text-amber-600",   linkHover: "hover:text-amber-700",   cardHover: "hover:bg-amber-50" },
  gray:    { title: "text-gray-700",    link: "text-gray-600",    linkHover: "hover:text-gray-700",    cardHover: "hover:bg-gray-50" },
  sky:     { title: "text-sky-700",     link: "text-sky-600",     linkHover: "hover:text-sky-700",     cardHover: "hover:bg-sky-50" },
  cyan:    { title: "text-cyan-700",    link: "text-cyan-600",    linkHover: "hover:text-cyan-700",    cardHover: "hover:bg-cyan-50" },
  green:   { title: "text-green-700",   link: "text-green-600",   linkHover: "hover:text-green-700",   cardHover: "hover:bg-green-50" },
  indigo:  { title: "text-indigo-700",  link: "text-indigo-600",  linkHover: "hover:text-indigo-700",  cardHover: "hover:bg-indigo-50" },
  pink:    { title: "text-pink-700",    link: "text-pink-600",    linkHover: "hover:text-pink-700",    cardHover: "hover:bg-pink-50" },
};

function themeC(name?: string | null) {
  const k = (name ?? "gray").toLowerCase().trim();
  return THEME[k] ?? THEME.gray;
}

/** Normalize anything from Supabase to a valid Vite public path */
function resolveImage(u?: string | null) {
  if (!u) return null;
  let s = u.trim();
  if (/^https?:\/\//i.test(s)) return s;              // full URL as-is
  s = s.replace(/^public\//i, "/");                    // public/images/x.png -> /images/x.png
  if (!s.startsWith("/")) s = "/images/" + s;          // nabi.png -> /images/nabi.png
  return s;
}

function fallbackRoute(title: string) {
  return "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export default function HomePage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("apps")
        .select('id, title, description, theme, image_url, show, "order", router')
        .eq("show", true)
        .order("order", { ascending: true });
      setApps((data as AppRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      <Seo
        title="AyahVault – Tools for Quran memorization and Islamic knowledge"
        description="Select from a variety of apps designed to help you learn Quran, build memorization, explore knowledge, and support your Islamic journey."
        canonical="https://ayahvault.com"
        ogTitle="AyahVault"
        ogDescription="Mini apps for Hifz, Arabic, and Islamic knowledge."
        ogImage="https://ayahvault.com/og/home.png"
        ogUrl="https://ayahvault.com"
      />

      {/* EXACT hero classes from your original */}
      <h1 className="mt-8 mb-4 text-5xl sm:text-6xl md:text-7xl font-mozilla text-black">
        AyahVault
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of apps designed to help you learn Quran,
        build memorization, explore knowledge, and support your Islamic journey.
      </p>

      {/* Card grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 items-stretch">
        {loading ? (
          <div className="col-span-full h-40 grid place-items-center rounded-2xl bg-white ring-1 ring-slate-200">
            <span className="text-slate-500">Loading…</span>
          </div>
        ) : (
          apps.map((app) => {
            const t = themeC(app.theme);
            const to = app.router?.trim() || fallbackRoute(app.title);
            const img = resolveImage(app.image_url);

            return (
              <Link
                key={app.id}
                to={to}
                aria-label={app.title}
                className={[
                  "block rounded-2xl bg-white ring-1 ring-slate-200 p-8 text-center transition",
                  t.cardHover,
                  "hover:shadow-md",
                ].join(" ")}
              >
                {/* App title (keep your sizing/weight) */}
                <h3 className={["text-2xl font-bold", t.title].join(" ")}>
                  {app.title}
                </h3>

                <p className="mt-2 text-gray-700">
                  {app.description}
                </p>

                <div className="mt-6 rounded-xl bg-white ring-1 ring-slate-200 p-1 overflow-hidden">
                  {img ? (
                    <img
                      src={img}
                      alt={`${app.title} preview`}
                      className="h-20 md:h-30 lg:h-50 w-full object-contain" // keep your current classes
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-40 grid place-items-center text-slate-400 text-sm">
                      (preview)
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  {/* Not a nested link—just styled text since the whole card is clickable */}
                  <span className={["text-sm font-semibold", t.link].join(" ")}>
                    Open →
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="mt-2 flex justify-center px-4">
        <ReviewsForm />
      </div>

      <Footer />
    </div>
  );
}
