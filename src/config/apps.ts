/** Edit enabled, then rebuild/deploy. Disabled apps also block direct URLs. */
export const apps = [
  {
    "id": "memobuddy",
    "title": "MemoBuddy",
    "description": "Generate random Quran verses within specified ranges ",
    "theme": "emerald",
    "image_url": "/images/memobuddy.png",
    "router": "/memobuddy",
    "enabled": true
  },
  {
    "id": "triviabuddy",
    "title": "TriviaBuddy",
    "description": "Play an Islamic Trivia game or create your own",
    "theme": "blue",
    "image_url": "/images/triviabuddy.png",
    "router": "/triviabuddy/setup",
    "enabled": false
  },
  {
    "id": "arabuddy",
    "title": "AraBuddy",
    "description": "Quranic Arabic vocabulary. Match the Arabic word to its English translation",
    "theme": "purple",
    "image_url": "/images/arabuddy.png",
    "router": "/arabuddy",
    "enabled": false
  },
  {
    "id": "hifzbuddy",
    "title": "HifzBuddy",
    "description": "Mutashabihāt trainer: complete-the-verse drills.",
    "theme": "red",
    "image_url": "/images/hifzbuddy.png",
    "router": "/hifzbuddy",
    "enabled": false
  },
  {
    "id": "nabibuddy",
    "title": "NabiBuddy",
    "description": "Reverse Akinator about the Prophets (beta).",
    "theme": "amber",
    "image_url": "/images/nabibuddy.png",
    "router": "/nabibuddy",
    "enabled": false
  }
] as const;
export type AppId = typeof apps[number]['id'];
