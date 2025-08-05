// src/pages/HomePage.tsx
import { Link } from "react-router-dom";
import Footer from "../components/Footer";

const apps = [
  {
    title: "MemoBuddy",
    desc: "Practice Quran memorization with randomly selected verses.",
    link: "/memobuddy",
  },
  // Add more apps here in future...
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-screen px-4 sm:px-6 lg:px-8">
      
      {/* Hero Section */}
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-mozilla text-black mb-4">
        AyahVault
      </h1>
      <p className="text-lg sm:text-xl text-gray-700 max-w-2xl mb-12">
        Select from a variety of apps designed to help you learn Quran,
        build memorization, explore knowledge, and support your Islamic journey.
      </p>

      {/* App Cards Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
        {apps.map((app) => (
          <Link
            key={app.title}
            to={app.link}
            className="bg-white hover:bg-emerald-50 hover:shadow-lg transition border border-slate-200 rounded-lg p-6 aspect-square flex flex-col"
          >
            <h2 className="text-xl font-bold text-emerald-700 mb-2">{app.title}</h2>
            <p className="text-gray-600 flex-1">{app.desc}</p>

             {/* App Preview Image */}
            <img
                src="/memobuddy.png"
                alt={`${app.title} preview`}
                className="mx-auto my-4 rounded-lg shadow-sm border border-gray-200"
            />

            <span className="mt-4 text-sm font-medium text-emerald-700">
              Open →
            </span>
          </Link>
        ))}
      </div>
      <Footer />
    </div>
  );
}
