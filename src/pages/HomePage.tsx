// src/pages/HomePage.tsx
import { Link } from "react-router-dom";

const apps = [
  {
    title: "MemoBuddy",
    desc: "Practice and memorize Quranic verses randomly.",
    link: "/memobuddy",
  },
  // Add more apps here in future...
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      
      {/* Hero Section */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-emerald-600 mb-4">
        AyahVault
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of mini‑apps designed to help you engage with the Quran,
        build memorization, explore knowledge, and support your Islamic learning journey.
      </p>

      {/* App Cards Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {apps.map((app) => (
          <Link
            key={app.title}
            to={app.link}
            className="block bg-white hover:bg-emerald-50 hover:shadow-lg transition border border-slate-200 rounded-lg p-6 aspect-square flex flex-col"
          >
            <h2 className="text-xl font-semibold mb-2">{app.title}</h2>
            <p className="text-gray-600 flex-1">{app.desc}</p>
            <span className="mt-4 text-sm font-medium text-emerald-700">
              Open →
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
