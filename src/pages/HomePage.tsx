// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";

/**
 * Theme → classes mapping.
 * NEW: added `cardHover` so each app card can use a theme-specific hover bg.
 */
const themeClasses = {
  emerald: {
    title: "text-emerald-700",
    button: "text-emerald-700",
    cardHover: "hover:bg-emerald-50", // NEW: per-theme hover background
  },
  blue: {
    title: "text-blue-700",
    button: "text-blue-700",
    cardHover: "hover:bg-blue-50", // NEW
  },
  purple: {
    title: "text-purple-700",
    button: "text-purple-700",
    cardHover: "hover:bg-purple-50", // NEW
  },
} as const;

type ThemeColor = keyof typeof themeClasses;

interface AppConfig {
  title: string;
  desc: string;
  link: string;
  image: string;
  themeColor: ThemeColor;
}

const apps: AppConfig[] = [
  {
    title: "MemoBuddy",
    desc: "Practice Quran memorization with randomly selected verses.",
    link: "/memobuddy",
    image: "/memobuddy.png",
    themeColor: "emerald",
  },
  {
    title: "TriviaBuddy",
    desc: "Test your Islamic knowledge with Jeopardy-style questions.",
    link: "/triviabuddy/setup",
    image: "/triviabuddy.png",
    themeColor: "blue",
  },
  {
    title: "AraBuddy",
    desc: "Match English–Arabic word pairs. Can you clear the board?",
    link: "/arabuddy",
    image: "/arabuddy.png", // TODO: replace with AraBuddy preview when ready
    themeColor: "purple",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      {/* Title */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-mozilla text-black mb-4">
        AyahVault
      </h1>

      {/* Subtitle */}
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of apps designed to help you learn Quran,
        build memorization, explore knowledge, and support your Islamic journey.
      </p>

      {/* Cards */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 items-stretch">
        {apps.map((app) => {
          const theme = themeClasses[app.themeColor]; // NEW: grab theme to use its hover class
          return (
            <Link
              key={app.title}
              to={app.link}
              className={[
                "bg-white transition border border-slate-200 rounded-lg p-6 h-96 flex flex-col",
                theme.cardHover, // NEW: theme-specific hover background color
                "hover:shadow-lg", // keep the nice hover shadow
              ].join(" ")}
            >
              {/* Title */}
              <h2 className={`text-xl font-bold ${theme.title} mb-2`}>
                {app.title}
              </h2>

              {/* Description */}
              <p className="text-gray-600 flex-1">{app.desc}</p>

              {/* Preview image */}
              <img
                src={app.image}
                alt={`${app.title} preview`}
                className="w-full h-40 object-contain mx-auto my-4 rounded-lg shadow-sm border border-gray-200"
              />

              {/* Open text */}
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
