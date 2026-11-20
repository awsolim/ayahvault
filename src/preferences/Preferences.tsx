import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
export const MIN_AYAH_SIZE = 24;
export const MAX_AYAH_SIZE = 64;
export const AYAH_SIZE_STEP = 4;
export const DEFAULT_AYAH_SIZE = 36;
function initialSize() {
  try { const n = Number(localStorage.getItem('ayahvault-ayah-size')); return Number.isFinite(n) && n >= MIN_AYAH_SIZE && n <= MAX_AYAH_SIZE && (n - MIN_AYAH_SIZE) % AYAH_SIZE_STEP === 0 ? n : DEFAULT_AYAH_SIZE; } catch { return DEFAULT_AYAH_SIZE; }
}
const Preferences = createContext<{ ayahSize: number; setAyahSize: (size: number) => void } | null>(null);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [ayahSize, setSize] = useState(initialSize);
  useEffect(() => { try { localStorage.setItem('ayahvault-ayah-size', String(ayahSize)); } catch { /* The preference still lasts for this visit. */ } }, [ayahSize]);
  const setAyahSize = (size: number) => setSize(Math.max(MIN_AYAH_SIZE, Math.min(MAX_AYAH_SIZE, MIN_AYAH_SIZE + Math.round((size - MIN_AYAH_SIZE) / AYAH_SIZE_STEP) * AYAH_SIZE_STEP)));
  return <Preferences.Provider value={{ ayahSize, setAyahSize }}>{children}</Preferences.Provider>;
}
export function usePreferences() { const value = useContext(Preferences); if (!value) throw new Error('Preferences provider missing'); return value; }
export function AyahSizeControl() {
 const { ayahSize, setAyahSize } = usePreferences();
 return <div className="size-control" role="group" aria-label="Ayah text size"><button type="button" onClick={() => setAyahSize(ayahSize - AYAH_SIZE_STEP)} disabled={ayahSize <= MIN_AYAH_SIZE} aria-label="Decrease ayah text size">−</button><output aria-live="polite">{ayahSize}<span> px</span></output><button type="button" onClick={() => setAyahSize(ayahSize + AYAH_SIZE_STEP)} disabled={ayahSize >= MAX_AYAH_SIZE} aria-label="Increase ayah text size">+</button></div>;
}
