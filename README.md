# AyahVault

Quran learning miniapps built with React, TypeScript, Vite, and Tailwind. The app runs as a static site with no database, account, or Supabase environment variables.

## Development

- Install: `npm ci`
- Develop: `npm run dev`
- Build: `npm run build`
- Preview production: `npm run preview`
- Lint: `npm run lint` (existing typing issues in older components still need cleanup)

Deploy the `dist` folder. Vercel SPA rewrites are already configured.

## Enable or disable miniapps

Edit `src/config/apps.ts`. Set an app's `enabled` boolean, then rebuild and deploy. This controls both home page cards and direct route access. Card order follows the file. Titles, descriptions, images, and links live there too.

MemoBuddy uses the existing bundled Quran dataset. TriviaBuddy supports custom boards immediately. The existing question banks and app settings have been recovered from the supplied PostgreSQL backup. MemoBuddy is enabled. AraBuddy and TriviaBuddy are disabled as AyahVault shifts toward a Quran companion; their source and existing browser saves remain intact. HifzBuddy and the unfinished NabiBuddy remain disabled.

## Preserve existing Supabase content

Export the following tables as JSON arrays and place them in the matching files. Keep the database until those exports have been imported and verified. No live database is accessed by this version.

| Table | Local file | Fields |
| --- | --- | --- |
| arabuddy | src/data/arabuddy.json | id (number), arabic, english |
| hifzbuddy | src/data/hifzbuddy.json | id (number), qtype, prompt, payload, answer, tags, difficulty, active |
| triviabuddy | src/data/triviabuddy.json | id, category, points, question, answer, include |

The files contain 219 Arabic word pairs, 8 HifzBuddy questions, and 107 trivia rows imported from the supplied backup. The original question wording, Arabic text, IDs, and include/active flags are preserved. No replacement religious content has been invented. For HifzBuddy, preserve structured JSON fields (legacy JSON strings are also parsed). See `src/apps/hifzbuddy/qtypes.ts` for the supported question shapes. Rows with `active: false` or `include: false` are excluded. Trivia presets only offer categories with all five point tiers: 100, 200, 300, 400, 500; at least three complete categories are needed to play. AraBuddy samples up to eight word pairs each round.

The apps table has restored the home card wording, order, and visibility. HifzBuddy can be enabled in the configuration. NabiBuddy has no implemented component or image yet, so it should remain disabled. Reviews are no longer collected; the old database submission form has been removed. Existing reviews stay in Supabase unless exported separately.

## Local saves and offline use

Trivia games and scores remain in this browser's localStorage, including existing saves. They do not sync across devices and clearing browser data removes them. Storage errors are displayed during game saves. Damaged saves are ignored instead of crashing the game list.

Production builds include a service worker caching app assets, Quran font, and game sounds. A first visit needs a connection. Miniapp code loads on demand, so visit an app online before expecting it to be available offline. Toggle changes require a deployment and an updated service worker on installed clients.


## Mushaf artwork

The reader uses locally hosted Dar al-Marefa Hafs Tajweed page artwork, displayed in black ink on white. All 604 pages preserve their printed layout. Image and overlay share the same aspect ratio; toolbar visibility never changes the reading frame. Ayah-to-page lookup is bundled, so opening an ayah does not require an external API. The previous Quran Foundation function remains available in the repository but is no longer used by the reader.

Artwork and coordinates live in public/mushaf/dar-al-marefa. Regenerate them with `python scripts/import-mushaf.py path/to/images_1280.zip`. Use the coordinates bundled inside the image archive: the separately distributed database is offset by 30 pixels horizontally. The importer validates bounds and generates the local ayah index. Tests check all 604 pages and 6,236 ayahs.

Pages are loaded near the current page and cached on demand in production (up to 120 image/metadata requests, expiring after 30 days). The full artwork is about 132 MiB and is excluded from app-shell precaching. Only previously loaded pages can work offline, and browsers may evict caches. Image lettering and word spacing cannot reflow independently of the printed page.

Source: [Quran Android's Tajweed provider](https://github.com/quran/quran_android/blob/main/pages/madani/src/main/java/com/quran/data/page/provider/tajweed/TajweedPageProvider.kt), [image archive](https://files.quran.app/hafs/tajweed/zips/images_1280.zip). [Quran iOS credits](https://github.com/quran/quran-ios#license-and-credits) identify Dar al-Marefa as the Tajweed artwork source. The artwork has separate publisher terms; this repository's code license does not grant image rights. The publisher's [FAQ](https://tajweedquran-store.com/en/faq/) mentions noncommercial electronic use of free services, but explicit redistribution and monochrome-display permission for AyahVault remains unconfirmed. Confirm those terms before public distribution.

## Installed app updates

Production registers its service worker through `virtual:pwa-register` with automatic activation and reload. It checks again on launch, foreground resume, window focus, and reconnection (at most once per minute). Failed or offline update checks leave the current version available. MemoBuddy state uses tab-local sessionStorage so an update reload can restore the selected ayah, pool, and practice controls; font size stays in localStorage. Closing the tab/session can clear the practice session.

The app shell is precached; mushaf artwork and coordinates are cached separately as pages are visited. Manifest and home-screen icon refresh timing is controlled by the browser/OS and differs from updating the app content. Validate upgrades using two production builds at the same origin; the development server does not register this service worker.
