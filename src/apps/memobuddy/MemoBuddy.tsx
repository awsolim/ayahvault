import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import quran from '../../assets/quran.json';
import surahNames from '../../utils/surahnames';

interface Verse {
  ayah: number;
  text: string;
  surah: number;
  ayahInSurah: number;
  juz: number;
}

function MemoBuddy() {
  const [randomVerse, setRandomVerse] = useState<Verse | null>(null);
  const [mode, setMode] = useState<'surah' | 'juz' | null>(null);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');
  const [useMultiRange, setUseMultiRange] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [partialMode, setPartialMode] = useState(false);
  const [partialWordCount, setPartialWordCount] = useState(1);
  const [showInfo, setShowInfo] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const navigate = useNavigate();

  const generateRandomVerse = () => {
    setErrorMessage('');
    setHasInteracted(true);

    const start = Number(rangeStart.trim());
    const end = useMultiRange ? Number(rangeEnd.trim()) : start;

    if (!rangeStart || isNaN(start) || isNaN(end)) {
      setRandomVerse(null);
      setErrorMessage('Please enter a valid number.');
      return;
    }

    const lower = Math.min(start, end);
    const upper = Math.max(start, end);

    if ((mode === 'surah' && (lower < 1 || upper > 114)) || (mode === 'juz' && (lower < 1 || upper > 30))) {
      setRandomVerse(null);
      setErrorMessage(`Invalid ${mode === 'surah' ? 'Surah' : 'Juz'} range.`);
      return;
    }

    const filtered = quran.filter((v) =>
      mode === 'surah' ? (v.surah >= lower && v.surah <= upper) : (v.juz >= lower && v.juz <= upper)
    );

    if (filtered.length === 0) {
      setRandomVerse(null);
      setErrorMessage('No verses found for this selection.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * filtered.length);
    setRandomVerse(filtered[randomIndex]);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      generateRandomVerse();
    }
    if (!randomVerse) return;

    const wordCount = randomVerse.text.split(' ').length;

    if (e.key === ' ') {
      e.preventDefault();
      setPartialMode((prev) => !prev);
      return;
    }

    if (e.key === 'ArrowDown' && partialMode) {
      e.preventDefault();
      setPartialWordCount((prev) => Math.max(1, prev - 1));
    } else if (e.key === 'ArrowUp' && partialMode) {
      e.preventDefault();
      setPartialWordCount((prev) => Math.min(wordCount, prev + 1));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateToAdjacentVerse(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      navigateToAdjacentVerse(1);
    }
  };

  const navigateToAdjacentVerse = (offset: number) => {
    const start = Number(rangeStart.trim());
    const end = useMultiRange ? Number(rangeEnd.trim()) : start;
    const lower = Math.min(start, end);
    const upper = Math.max(start, end);
    const filtered = quran.filter((v) =>
      mode === 'surah' ? (v.surah >= lower && v.surah <= upper) : (v.juz >= lower && v.juz <= upper)
    );
    if (!randomVerse || filtered.length === 0) return;

    const currentIndex = filtered.findIndex(v => v.ayah === randomVerse.ayah);
    const newIndex = currentIndex + offset;

    if (newIndex >= 0 && newIndex < filtered.length) {
      setRandomVerse(filtered[newIndex]);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  return (
    
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-900">

        <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 bg-white border border-slate-300 rounded-full px-3 py-2 text-sm font-medium shadow hover:bg-emerald-50 transition"
        >
        ← Home
        </button>

      <h1 className="text-3xl font-bold text-emerald-600 mb-4">Quran Memorization Assistant</h1>

      <div className="mb-4 flex space-x-4">
        <button
          className={`px-4 py-2 rounded-lg border font-semibold shadow-md transition-all duration-300 ease-in-out 
            ${mode === 'surah'
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 hover:scale-105 shadow-lg'
              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50 hover:scale-105'}`}
          onClick={() => {
            setMode('surah');
            setRangeStart('');
            setRangeEnd('');
            setUseMultiRange(false);
            setErrorMessage('');
            setRandomVerse(null);
            setHasInteracted(false);
          }}
        >
          Select by Surah
        </button>
        <button
          className={`px-4 py-2 rounded-lg border font-semibold shadow-md transition-all duration-300 ease-in-out 
            ${mode === 'juz'
              ? 'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 hover:scale-105 shadow-lg'
              : 'bg-white text-emerald-600 border-emerald-400 hover:bg-emerald-50 hover:scale-105'}`}
          onClick={() => {
            setMode('juz');
            setRangeStart('');
            setRangeEnd('');
            setUseMultiRange(false);
            setErrorMessage('');
            setRandomVerse(null);
            setHasInteracted(false);
          }}
        >
          Select by Juz
        </button>
      </div>

      {mode && (
        <div className="mb-4 flex items-center space-x-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={rangeStart}
            onChange={(e) => /^[0-9]*$/.test(e.target.value) && setRangeStart(e.target.value)}
            className="border rounded px-2 py-2 w-16 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300"
            placeholder={mode}
          />
          {useMultiRange && (
            <>
              <span>to</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rangeEnd}
                onChange={(e) => /^[0-9]*$/.test(e.target.value) && setRangeEnd(e.target.value)}
                className="border rounded px-2 py-2 w-16 text-center bg-white shadow-sm focus:ring-2 focus:ring-emerald-300"
                placeholder={mode}
              />
            </>
          )}
          <button
            onClick={() => setUseMultiRange((prev) => !prev)}
            className="text-sm font-medium text-emerald-600 underline hover:text-teal-600 transition"
          >
            {useMultiRange ? 'Use single range' : `Select multi-${mode} range`}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 max-w-md w-full text-center min-h-[160px]">
        {!hasInteracted ? (
          <p className="text-gray-500">Select a mode and enter a number to generate a verse.</p>
        ) : errorMessage ? (
          <p className="text-red-600 font-medium">{errorMessage}</p>
        ) : randomVerse ? (
          <>
            {showInfo && (
              <p className="text-gray-600 text-sm mb-2">
                Surah {randomVerse.surah}: {surahNames[randomVerse.surah]} &nbsp;&nbsp;
                Ayah: {randomVerse.ayahInSurah} &nbsp;
                Juz: {randomVerse.juz}
              </p>
            )}
            <p className="text-2xl font-semibold text-gray-800 leading-loose">
              {partialMode
                ? '… ' + randomVerse.text.split(' ').slice(0, partialWordCount).join(' ')
                : randomVerse.text}
            </p>
            <button
              onClick={generateRandomVerse}
              className="mt-6 px-4 py-2 text-white rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:brightness-110 hover:scale-105 shadow-lg transition-all duration-300 ease-in-out"
            >
              Show Another Verse
            </button>
          </>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        <div>
          <p className="font-medium text-sm text-gray-700 mb-1 ">
            Preview Amount  
            <span className="ml-4 text-xs text-gray-400">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs border border-gray-300 mr-1"> Spacebar </kbd> to toggle 
            </span>
            
            </p>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={!partialMode}
                onChange={() => setPartialMode(false)}
              />
              <span>Full Preview</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={partialMode}
                onChange={() => setPartialMode(true)}
              />
              <span>Partial Preview</span>
            </label>
            {partialMode && (
  <div className="flex items-center space-x-2 mt-2">
    <input
      type="number"
      min={1}
      value={partialWordCount}
      onChange={(e) => {
        const val = Number(e.target.value);
        if (val >= 1) setPartialWordCount(val);
      }}
      className="border px-2 py-1 rounded w-24"
    />

    {/* Instruction beside the box */}
    <p className="text-xs text-gray-500 flex items-center space-x-1 ml-2">
      <kbd className="px-1.5 py-0.5 border rounded bg-gray-100 text-xs font-mono">↑</kbd>
      <kbd className="px-1.5 py-0.5 border rounded bg-gray-100 text-xs font-mono">↓</kbd>
      <span>to change</span>
    </p>
  </div>
)}

          </div>
        </div>

        <div>
          <p className="font-medium text-sm text-gray-700 mb-1">Verse Information</p>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={showInfo}
                onChange={() => setShowInfo(true)}
              />
              <span>Show</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!showInfo}
                onChange={() => setShowInfo(false)}
              />
              <span>Hide</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemoBuddy;
