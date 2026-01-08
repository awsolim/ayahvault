// src/apps/memobuddy/components/SurahReference.tsx

import React from 'react';

const surahNames = [
  "Al-Fatihah", "Al-Baqarah", "Aali 'Imran", "An-Nisa'", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah", "Yunus",
  "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra'", "Al-Kahf", "Maryam", "Ta-Ha",
  "Al-Anbiya'", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara'", "An-Naml", "Al-Qasas", "Al-'Ankabut", "Ar-Rum",
  "Luqman", "As-Sajdah", "Al-Ahzab", "Saba'", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat", "Qaf",
  "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadilah", "Al-Hashr", "Al-Mumtahanah",
  "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim", "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij",
  "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah", "Al-Insan", "Al-Mursalat", "An-Naba'", "An-Nazi'at", "'Abasa",
  "At-Takwir", "Al-Infitar", "Al-Mutaffifin", "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad",
  "Ash-Shams", "Al-Layl", "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-'Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-'Adiyat",
  "Al-Qari'ah", "At-Takathur", "Al-'Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];

interface SurahReferenceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SurahReference({ isOpen, onClose }: SurahReferenceProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-emerald-100">
        
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center bg-emerald-50">
          <h2 className="text-xl font-bold text-emerald-800">Surah Reference</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-emerald-100 text-emerald-600 text-2xl font-bold transition-colors"
          >
            ×
          </button>
        </div>

        {/* List Content */}
        <div className="overflow-y-auto p-4 grid grid-cols-2 gap-2">
          {surahNames.map((name, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-2 rounded-xl border border-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm">
                {index + 1}
              </span>
              <span className="text-sm font-semibold text-slate-700 group-hover:text-emerald-800">
                {name}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t text-center">
          <button 
            onClick={onClose}
            className="px-8 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow hover:bg-emerald-700 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}