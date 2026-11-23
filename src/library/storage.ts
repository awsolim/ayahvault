import type { RecordRow } from "./model";
import type { RemoteRow } from "./sync";
let opening: Promise<IDBDatabase> | undefined;
function database() {
  if (!opening)
    opening = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("ayahvault-library", 1);
      request.onupgradeneeded = () => {
        const store = request.result.createObjectStore("entries", {
          keyPath: "key",
        });
        store.createIndex("scope", "scope");
      };
      request.onsuccess = () => {
        request.result.onversionchange = () => {
          request.result.close();
          opening = undefined;
        };
        resolve(request.result);
      };
      request.onerror = () => {
        opening = undefined;
        reject(request.error);
      };
      request.onblocked = () => {
        opening = undefined;
        reject(new Error("Close other AyahVault tabs and try again."));
      };
    });
  return opening;
}
export async function readRows(scope: string): Promise<RecordRow[]> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("entries");
    const req = tx.objectStore("entries").index("scope").getAll(scope);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
export function changeRow(
  key: string,
  update: (current: RecordRow | undefined) => RecordRow | undefined,
): Promise<void> {
  return changeRows([key], update);
}
export async function changeRows(
  keys: string[],
  update: (current: RecordRow | undefined) => RecordRow | undefined,
): Promise<void> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("entries", "readwrite");
    const store = tx.objectStore("entries");
    for (const key of keys) {
      const req = store.get(key);
      req.onsuccess = () => {
        try {
          const next = update(req.result);
          if (next) store.put(next);
          else store.delete(key);
        } catch (error) {
          tx.abort();
          reject(error);
        }
      };
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Couldn’t save on this device."));
  });
}
export async function claimGuest(scope: string) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("entries", "readwrite");
    const store = tx.objectStore("entries");
    const request = store.index("scope").getAll("guest");
    request.onsuccess = () => {
      for (const row of request.result as RecordRow[]) {
        if (!row.deleted) {
          const target = store.get(scope + ":" + row.id);
          target.onsuccess = () => {
            // A restored backup may share an ID with an account's pending edit.
            // Keep both rather than overwriting either device version.
            const id = target.result ? crypto.randomUUID() : row.id;
            store.put({
              ...row,
              id,
              entry: { ...row.entry, id },
              scope,
              key: scope + ":" + id,
              revision: 0,
              dirty: true,
            });
          };
        }
        store.delete(row.key);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
export async function resolveConflict(key: string, remote: RemoteRow) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("entries", "readwrite");
    const store = tx.objectStore("entries");
    const request = store.get(key);
    request.onsuccess = () => {
      const current = request.result as RecordRow | undefined;
      if (!current) return;
      if (!current.deleted) {
        const id = crypto.randomUUID();
        store.put({
          ...current,
          id,
          key: current.scope + ":" + id,
          revision: 0,
          dirty: true,
          entry: {
            ...current.entry,
            id,
            title:
              (current.entry.title.slice(0, 180) || "Comparison") +
              " — local copy",
          },
        });
      }
      store.put({
        ...current,
        entry: remote.payload,
        revision: remote.revision,
        deleted: remote.deleted,
        dirty: false,
      });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
