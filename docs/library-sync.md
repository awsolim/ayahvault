# Library and optional cloud sync

Mushaf, MemoBuddy, Library reading, and local entry editing require no account.
The Library saves entries and deletion tombstones in IndexedDB. Device-only
entries use the `guest` scope; signed-in accounts use their Supabase user UUID.
Signing out hides that account's entries without deleting its offline data.
Export/import backups are available from Library even without cloud setup.

## Connect the new AyahVault Supabase project

1. Create a separate Supabase project for AyahVault. Do not use Madrasa's project.
2. Run [the migration](../supabase/migrations/20261122000000_ayahvault_library.sql)
   in its SQL Editor. It creates a user-scoped table, read policy, and revision
   checked write function. It does not modify any existing Mutqin tables.
3. Copy `.env.example` to `.env.local`. Fill `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_PUBLISHABLE_KEY` using the project URL and **public publishable
   key** (the legacy public anon key also works). Never put a secret/service-role
   key in a `VITE_` variable. Set the same values in your deployment environment.
4. Enable email authentication. In Authentication → URL Configuration, set the
   Site URL to the deployed app origin and add its `/library/account` URL to the
   redirect allowlist. Also allow `http://localhost:5173/library/account` for
   local development. Use your actual dev URL if it differs.
5. Configure production email delivery in Supabase. The default mail service
   has delivery/rate restrictions. For code entry inside an installed PWA, the
   email template must include `{{ .Token }}`. Keep the magic link too if desired.
6. Restart Vite/rebuild the deployment. Open Library → Saved on this device (or
   Settings → Backup & Sync), then sign in. Signing in explicitly opts into
   syncing device-only entries into that account.

No cloud credentials are included in this repository. Until connected, Backup &
Sync explains that entries remain on the device; there is no account gate.

## Sync semantics

- Guest entries move atomically into the signed-in account's device scope when
  the first online sync begins. They are marked pending before upload. Existing
  cloud entries are downloaded into that same account scope.
- Saves commit to IndexedDB before the UI reports success. Failed uploads stay
  queued. Sync retries after changes, reconnection, foreground resume, once per
  minute while foregrounded, and manually from Backup & Sync.
- Server revisions, rather than device clocks, control writes. A stale update
  cannot overwrite a newer server version. The latest local edit is preserved
  as a separate entry labeled “local copy”; the cloud entry is retained too.
  The UI reports this. The preserved copy uploads on the next sync pass.
- Deletions sync as tombstones. A deletion conflicting with a newer cloud edit
  retains the cloud edit and reports a conflict, so a stale deletion cannot
  silently erase another device's work.
- Edits made while an upload is pending remain dirty against the acknowledged
  server revision and are uploaded in a later pass.
- No Quran text or image content is uploaded. Payloads contain references,
  user notes, legend labels/colors, and word-position spans tied to a versioned
  Arabic text source. Page markers use the matched artwork's ending coordinates.
- Browser storage can be cleared/evicted. Local-only saves are not backups.
  Export copies for safekeeping, or enable cloud sync after setup.

## Verify before releasing cloud sync

Run `npm test`, `npm run test:e2e`, and `npm run build`. Browser tests use an
isolated phone-sized Chromium profile and test local save/reload, comparison
marks, notes, mushaf linking, fixed page geometry, and backup restore. Install
its browser once with `npx playwright install chromium`.

Live Supabase authentication, RLS, and cross-device sync require the actual new
project. Test with two accounts (each sees only its own entries) and two devices
on one account: create, edit offline, reconnect, make competing edits, delete,
and sign out. Confirm a fresh device restores entries after sign-in. Email
delivery and installed-iPhone authentication also need live verification.
