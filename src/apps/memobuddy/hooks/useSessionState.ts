import { useState, type Dispatch, type SetStateAction } from 'react';
// Keeps the current practice session when its route unmounts. Cleared on reload.
const session = new Map<string, unknown>();
export function useSessionState<T>(key: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
 const [value, setValue] = useState<T>(() => session.has(key) ? session.get(key) as T : initial);
 const update: Dispatch<SetStateAction<T>> = next => setValue(previous => {
  const result = typeof next === 'function' ? (next as (value: T) => T)(previous) : next;
  session.set(key, result);
  return result;
 });
 return [value, update];
}
