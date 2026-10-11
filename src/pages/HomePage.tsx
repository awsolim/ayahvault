import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";
import { apps as appConfig } from "../config/apps";
import Seo from "../lib/Seo";



/** Theme map, now includes per-theme hover bg */
const themeClasses = {
  emerald: {
    title: "text-emerald-700",
    button: "text-emerald-700",
    cardHover: "hover:bg-emerald-50",   // NEW
  },
  blue: {
    title: "text-blue-700",
    button: "text-blue-700",
    cardHover: "hover:bg-blue-50",      // NEW
  },
  purple: {
    title: "text-purple-700",
    button: "text-purple-700",
    cardHover: "hover:bg-purple-50",    // NEW
  },
  amber: {
    title: "text-amber-700",
    button: "text-amber-700",
    cardHover: "hover:bg-amber-50",     // NEW
  },
  red: {
    title: "text-red-700",
    button: "text-red-700",
    cardHover: "hover:bg-red-50",       // NEW
  },
} as const;

type ThemeKey = keyof typeof themeClasses;



function themeFor(name?: string | null) {
  const k = (name ?? "").toLowerCase().trim() as ThemeKey;
  return (
    themeClasses[k] ?? {
      title: "text-gray-700",
      button: "text-gray-700",
      cardHover: "hover:bg-slate-50",
    }
  );
}
function fallbackRoute(title: string) {
  return "/" + title.toLowerCase().replace(/[^a-z0-9]+/g, "");
}
function imgPath(u?: string | null) {
  if (!u) return "";
  return u.startsWith("/") ? u : `/${u}`;
}

export default function HomePage() {
  const apps = appConfig.filter(app => app.enabled);

  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      <Seo title="AyahVault – Quran Learning Apps" description="Practice Quran memorization and create trivia games with AyahVault." canonical="https://ayahvault.com/" />
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-mozilla text-black mb-4">
        AyahVault
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of apps designed to help you learn Quran,
        build memorization, explore knowledge, and support your Islamic journey.
      </p>

      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6 mb-12 items-stretch">
        {apps.map((app) => {
            const theme = themeFor(app.theme);
            const link = app.router?.trim() || fallbackRoute(app.title);
            const image = imgPath(app.image_url);

            return (
              <Link
                key={app.id}
                to={link}
                className={[
                  "bg-white border border-slate-200 rounded-lg p-6 h-96 flex flex-col transition hover:shadow-lg",
                  theme.cardHover, // <- theme-specific hover color
                ].join(" ")}
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
          })}
      </div>

      <Footer />
    </div>
  );
}
