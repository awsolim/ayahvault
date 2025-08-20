import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import ReviewsForm from "../components/layout/ReviewsForm";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

/** SAME theme map as before */
const themeClasses = {
  emerald: { title: "text-emerald-700", button: "text-emerald-700" },
  blue:    { title: "text-blue-700",    button: "text-blue-700" },
  purple:  { title: "text-purple-700",  button: "text-purple-700" },
  amber:   { title: "text-amber-700",   button: "text-amber-700" },
  red:     { title: "text-red-700",     button: "text-red-700" },
} as const;

type ThemeKey = keyof typeof themeClasses;

type AppRow = {
  id: number;
  title: string;
  description: string;
  theme: string | null;
  image_url: string | null;
  router: string | null;
  show: boolean;
  order: number;
};

function themeFor(name?: string | null) {
  const k = (name ?? "").toLowerCase().trim() as ThemeKey;
  return themeClasses[k] ?? { title: "text-gray-700", button: "text-gray-700" };
}
function fallbackRoute(title: string) {
  return "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function imgPath(u?: string | null) {
  if (!u) return "";
  return u.startsWith("/") ? u : `/${u}`;
}

export default function HomePage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("apps")
        .select('id, title, description, theme, image_url, router, show, "order"')
        .eq("show", true)
        .order("order", { ascending: true });
      setApps((data as AppRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      {/* Hero — unchanged */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-mozilla text-black mb-4">
        AyahVault
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of apps designed to help you learn Quran,
        build memorization, explore knowledge, and support your Islamic journey.
      </p>

      {/* Cards — EXACT classes from before */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 items-stretch">
        {loading ? (
          <div className="col-span-full h-40 grid place-items-center rounded-lg border border-slate-200 bg-white">
            <span className="text-slate-500">Loading…</span>
          </div>
        ) : (
          apps.map((app) => {
            const theme = themeFor(app.theme);
            const link = app.router?.trim() || fallbackRoute(app.title);
            const image = imgPath(app.image_url);

            return (
              <Link
                key={app.id}
                to={link}
                className="bg-white hover:bg-emerald-50 hover:shadow-lg transition border border-slate-200 rounded-lg p-6 h-96 flex flex-col"
              >
                <h2 className={`text-xl font-bold ${theme.title} mb-2`}>
                  {app.title}
                </h2>

                <p className="text-gray-600 flex-1">{app.description}</p>

                <img
                  src={image}
                  alt={`${app.title} preview`}
                  className="w-full h-40 object-contain mx-auto my-4 rounded-lg shadow-sm border border-gray-200"
                  loading="lazy"
                />

                <span className={`mt-4 text-sm font-medium ${theme.button}`}>
                  Open →
                </span>
              </Link>
            );
          })
        )}
      </div>

      {/* Reviews */}
      <div className="w-full max-w-6xl mb-8">
        <ReviewsForm />
      </div>

      <Footer />
    </div>
  );
}
