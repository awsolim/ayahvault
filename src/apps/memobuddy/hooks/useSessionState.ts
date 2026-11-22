import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
// Tab-local storage survives automatic app updates without syncing to other tabs.
const session = new Map<string, unknown>();
const prefix = 'ayahvault-memobuddy:';
function readSession<T>(key: string, initial: T): T {
 if (session.has(key)) return session.get(key) as T;
 try {
  const saved = sessionStorage.getItem(prefix + key);
  if (saved !== null) {
   const parsed = JSON.parse(saved);
   if (typeof parsed === typeof initial && Array.isArray(parsed) === Array.isArray(initial)) return parsed as T;
  }
 } catch { /* Memory-only state still works when browser storage is blocked. */ }
 return initial;
}
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
 const [value, setValue] = useState<T>(() => readSession(key, initial));
 const update: Dispatch<SetStateAction<T>> = useCallback(next => setValue(previous => {
  const result = typeof next === 'function' ? (next as (value: T) => T)(previous) : next;
  session.set(key, result);
  try { sessionStorage.setItem(prefix + key, JSON.stringify(result)); } catch { /* Preserve the in-memory session if storage is full. */ }
  return result;
 }), [key]);
 return [value, update];
}
