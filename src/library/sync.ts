import type { Entry, RecordRow } from "./model";
export type RemoteRow = {
  id: string;
  payload: Entry;
  revision: number;
  deleted: boolean;
};
export function acceptRemote(
  local: RecordRow | undefined,
  remote: RemoteRow,
  scope: string,
): RecordRow {
  return local?.dirty
    ? local
    : {
        key: scope + ":" + remote.id,
        scope,
        id: remote.id,
        entry: remote.payload,
        revision: remote.revision,
        dirty: false,
        deleted: remote.deleted,
      };
}
export function acknowledge(
  current: RecordRow | undefined,
  sent: RecordRow,
  remote: RemoteRow,
): RecordRow | undefined {
  if (!current) return current;
  // A save during a network request must stay queued against the new revision.
  const unchanged =
    JSON.stringify(current.entry) === JSON.stringify(sent.entry) &&
    current.deleted === sent.deleted;
  return { ...current, revision: remote.revision, dirty: !unchanged };
}
