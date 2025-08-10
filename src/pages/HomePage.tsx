// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import Footer from "../components/layout/Footer";

/**
 * Define your theme‐to‐class mapping.
 */
const themeClasses = {
  emerald: {
    title: "text-emerald-700",
    button: "text-emerald-700",
  },
  blue: {
    title: "text-blue-700",
    button: "text-blue-700",
  },
  purple: { // NEW: purple theme for AraBuddy
    title: "text-purple-700",
    button: "text-purple-700",
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
    title: "AraBuddy", // NEW
    desc: "Match English–Arabic word pairs. Can you clear the board?",
    link: "/arabuddy", // NEW
    image: "/arabuddy.png", // TEMP: reuse an existing image; replace when you have a logo
    themeColor: "purple", // NEW
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-mozilla text-black mb-4">
        AyahVault
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of apps designed to help you learn Quran,
        build memorization, explore knowledge, and support your Islamic journey.
      </p>

      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12 items-stretch">
        {apps.map((app) => {
          const theme = themeClasses[app.themeColor];
          return (
            <Link
              key={app.title}
              to={app.link}
              className="bg-white hover:bg-emerald-50 hover:shadow-lg transition border border-slate-200 rounded-lg p-6 h-96 flex flex-col"
            >
              <h2 className={`text-xl font-bold ${theme.title} mb-2`}>
                {app.title}
              </h2>

              <p className="text-gray-600 flex-1">{app.desc}</p>

              <img
                src={app.image}
                alt={`${app.title} preview`}
                className="w-full h-40 object-contain mx-auto my-4 rounded-lg shadow-sm border border-gray-200"
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
