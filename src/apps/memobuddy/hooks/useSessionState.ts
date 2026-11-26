import {
  useCallback,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
// Tab-local storage survives automatic app updates without syncing to other tabs.
const session = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
const prefix = "ayahvault-memobuddy:";
function readSession<T>(
  key: string,
  initial: T,
  validate?: (value: unknown) => value is T,
): T {
  if (session.has(key)) {
    const saved = session.get(key);
    return !validate || validate(saved) ? (saved as T) : initial;
  }
  try {
    const saved = sessionStorage.getItem(prefix + key);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (
        validate
          ? validate(parsed)
          : typeof parsed === typeof initial &&
            Array.isArray(parsed) === Array.isArray(initial)
      ) {
        session.set(key, parsed);
        return parsed as T;
      }
    }
  } catch {
    /* Memory-only state still works when browser storage is blocked. */
  }
  session.set(key, initial);
  return initial;
}
export function useSessionState<T>(
  key: string,
  initial: T,
  validate?: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const snapshot = useCallback(
    () => readSession(key, initial, validate),
    [key, initial, validate],
  );
  const subscribe = useCallback(
    (listener: () => void) => {
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(listener);
      return () => {
        listeners.get(key)?.delete(listener);
      };
    },
    [key],
  );
  const value = useSyncExternalStore(subscribe, snapshot);
  const update: Dispatch<SetStateAction<T>> = useCallback(
    (next) => {
      const previous = readSession(key, initial, validate);
      const result =
        typeof next === "function" ? (next as (value: T) => T)(previous) : next;
      if (Object.is(previous, result)) return;
      session.set(key, result);
      try {
        sessionStorage.setItem(prefix + key, JSON.stringify(result));
      } catch {
        /* Preserve the in-memory session if storage is full. */
      }
      listeners.get(key)?.forEach((listener) => listener());
    },
    [key, initial, validate],
  );
  return [value, update];
}
