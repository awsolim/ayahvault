import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { cloud } from "./cloud";
import { readRows, changeRow, changeRows, claimGuest, resolveConflict } from "./storage";
import { acknowledge, acceptRemote, type RemoteRow } from "./sync";
import { rowKey, validateEntry, type Entry, type RecordRow } from "./model";
import chapters from "../assets/chapters.json";
type LibraryState = {
  rows: RecordRow[];
  ready: boolean;
  pending: boolean;
  scope: string;
  user: User | null;
  message: string;
  syncing: boolean;
  error: string;
  save: (entry: Entry, scope: string) => Promise<void>;
  remove: (ids: string | string[]) => Promise<void>;
  sync: () => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<LibraryState | null>(null);
export function LibraryProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!cloud);
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [ready, setReady] = useState(false);
  const [loadedScope, setLoadedScope] = useState('');
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [syncing, setSyncing] = useState(false);
  const scope = user?.id || "guest";
  const currentScope = useRef(scope);
  currentScope.current = scope;
  const busy = useRef(false);
  const refresh = useCallback(async () => {
    const result = await readRows(scope);
    if (currentScope.current === scope) { setRows(result); setLoadedScope(scope); }
  }, [scope]);
  useEffect(() => {
    if (!cloud) return;
    const { data } = cloud.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    setReady(false);
    setRows([]);
    setError("");
    readRows(scope)
      .then((result) => {
        if (!cancelled) {
          setRows(result);
          setLoadedScope(scope);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Device storage is unavailable. Library changes cannot be saved.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [scope, authReady]);
  const sync = useCallback(async () => {
    if (!cloud || scope === "guest" || !navigator.onLine || busy.current)
      return;
    busy.current = true;
    setSyncing(true);
    setError("");
    let conflicts = 0;
    try {
      const client = cloud;
      const { data: auth, error: authError } = await client.auth.getSession();
      if (authError) throw authError;
      if (auth.session?.user.id !== scope || currentScope.current !== scope)
        return;
      // Bind every request to this session, even if a different account signs in
      // while the sync is in flight. Never upload an old account's notes as another.
      const authorization = "Bearer " + auth.session.access_token;
      await claimGuest(scope);
      const queued = (await readRows(scope)).filter((r) => r.dirty);
      for (const row of queued) {
        if (currentScope.current !== scope) return;
        const { data, error: failure } = await client
          .rpc("save_ayahvault_entry", {
            p_id: row.id,
            p_payload: row.entry,
            p_base_revision: row.revision,
            p_deleted: row.deleted,
          })
          .setHeader("Authorization", authorization);
        if (failure) throw failure;
        const remote = data.row as RemoteRow;
        if (
          !validateEntry(
            remote.payload,
            chapters.map((c) => c.verses),
          ) ||
          remote.id !== row.id
        )
          throw new Error("Invalid cloud entry.");
        if (data.conflict) {
          // The copy and replacement share a transaction, including edits made in flight.
          await resolveConflict(row.key, remote);
          conflicts++;
        } else
          await changeRow(row.key, (current) =>
            acknowledge(current, row, remote),
          );
      }
      for (let offset = 0; ; offset += 500) {
        const { data, error: failure } = await client
          .from("ayahvault_library_entries")
          .select("id,payload,revision,deleted")
          .eq("user_id", scope)
          .order("id")
          .range(offset, offset + 499)
          .setHeader("Authorization", authorization);
        if (failure) throw failure;
        if (currentScope.current !== scope) return;
        for (const remote of data as RemoteRow[]) {
          if (
            !validateEntry(
              remote.payload,
              chapters.map((c) => c.verses),
            )
          )
            throw new Error("Invalid cloud entry.");
          await changeRow(rowKey(scope, remote.id), (local) =>
            acceptRemote(local, remote, scope),
          );
        }
        if (data.length < 500) break;
      }
      setMessage(
        conflicts
          ? "Both versions were kept. Review entries marked “local copy”."
          : "",
      );
      await refresh();
    } catch (e) {
      if (currentScope.current === scope) {
        setError(
          e instanceof Error
            ? e.message
            : "Sync failed. Your device changes are still saved.",
        );
        await refresh().catch(() => {});
      }
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, [scope, refresh]);
  const save = useCallback(
    async (entry: Entry, expectedScope: string) => {
      if (!authReady || currentScope.current !== expectedScope)
        throw new Error(
          "Your account changed. Reopen this entry before saving.",
        );
      if (
        !validateEntry(
          entry,
          chapters.map((c) => c.verses),
        )
      )
        throw new Error(
          "Check the passages and comparison marks before saving.",
        );
      await changeRow(rowKey(scope, entry.id), (previous) => {
        if (
          previous &&
          (previous.deleted || previous.entry.updatedAt !== entry.updatedAt)
        )
          throw new Error(
            "This entry changed in another tab or device. Save your draft as a new entry to keep both versions.",
          );
        return {
          key: rowKey(scope, entry.id),
          scope,
          id: entry.id,
          entry: { ...entry, updatedAt: new Date().toISOString() },
          revision: previous?.revision || 0,
          deleted: false,
          dirty: true,
        };
      });
      await refresh();
      window.dispatchEvent(new Event("ayahvault-library-change"));
    },
    [scope, refresh, authReady],
  );
  const remove = useCallback(
    async (ids: string | string[]) => {
      const keys = (typeof ids === "string" ? [ids] : ids).map((id) => rowKey(scope, id));
      await changeRows(keys, (previous) =>
        previous ? { ...previous, dirty: true, deleted: true } : undefined,
      );
      await refresh();
      window.dispatchEvent(new Event("ayahvault-library-change"));
    },
    [scope, refresh],
  );
  useEffect(() => {
    const update = () => {
      void refresh().catch(() => {});
      void sync();
    };
    const foreground = () => {
      if (document.visibilityState === "visible") update();
    };
    window.addEventListener("ayahvault-library-change", update);
    window.addEventListener("online", update);
    document.addEventListener("visibilitychange", foreground);
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("ayahvault-library")
        : null;
    if (channel) channel.onmessage = update;
    const broadcast = () => channel?.postMessage("changed");
    window.addEventListener("ayahvault-library-change", broadcast);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void sync();
    }, 60000);
    if (authReady) void sync();
    return () => {
      clearInterval(timer);
      window.removeEventListener("ayahvault-library-change", update);
      window.removeEventListener("online", update);
      document.removeEventListener("visibilitychange", foreground);
      window.removeEventListener("ayahvault-library-change", broadcast);
      channel?.close();
    };
  }, [refresh, sync, authReady]);
  return (
    <Context.Provider
      value={{
        rows: ready && loadedScope === scope ? rows.filter((r) => !r.deleted) : [],
        scope,
        ready: ready && loadedScope === scope,
        pending: rows.some((r) => r.dirty),
        user,
        error,
        message,
        syncing,
        save,
        remove,
        sync,
        refresh,
      }}
    >
      {children}
    </Context.Provider>
  );
}
// A hook and its provider deliberately share the same context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useLibrary() {
  const value = useContext(Context);
  if (!value) throw new Error("Library provider missing");
  return value;
}
