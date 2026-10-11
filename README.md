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

MemoBuddy uses the existing bundled Quran dataset. TriviaBuddy supports custom boards immediately. The existing question banks and app settings have been recovered from the supplied PostgreSQL backup. MemoBuddy, TriviaBuddy, and AraBuddy are enabled. HifzBuddy and the unfinished NabiBuddy remain disabled, matching the backup.

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
