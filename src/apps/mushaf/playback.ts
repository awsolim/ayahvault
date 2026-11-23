import { useEffect, useRef, useState } from "react";
import { getMinshawiMurattalUrl } from "../../lib/ayahAudio";
import { ayahIndex, ayahKeys, readDeviceValue } from "./readerPosition";

export const reciters = { minshawi: { name: "Minshawi Murattal", audioUrl: getMinshawiMurattalUrl } };

export type PlaybackOptions = {
  reciter: keyof typeof reciters;
  speed: number;
  ayahRepeat: number;
  rangeRepeat: number;
};
export type AyahRange = { from: string; to: string };
export type PlaybackPlan = PlaybackOptions & AyahRange;

export const defaultPlaybackOptions: PlaybackOptions = { reciter: "minshawi", speed: 1, ayahRepeat: 1, rangeRepeat: 1 };
export const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
export const playbackRepeats = [1, 2, 3, 4, 5, 10];
const settingsKey = "ayahvault-mushaf-playback";

export function readPlaybackPlan(): PlaybackPlan | null {
  try {
    const plan: PlaybackPlan | null = JSON.parse(readDeviceValue(settingsKey) || "null");
    if (!plan || !Object.hasOwn(reciters, plan.reciter)) return null;
    const start = ayahIndex(plan.from);
    if (start < 0 || ayahIndex(plan.to) < start) return null;
    if (!playbackSpeeds.includes(plan.speed) || !playbackRepeats.includes(plan.ayahRepeat) || !playbackRepeats.includes(plan.rangeRepeat)) return null;
    return plan;
  } catch {
    return null;
  }
}

export function savePlaybackPlan(plan: PlaybackPlan) {
  try { localStorage.setItem(settingsKey, JSON.stringify(plan)); } catch { /* The current reader retains the settings. */ }
}

type PlaybackRun = {
  plan: PlaybackPlan;
  start: number;
  end: number;
  index: number;
  ayahPass: number;
  rangePass: number;
};

export function useMushafPlayback(onTrack: (ayah: string) => void) {
  const audio = useRef<HTMLAudioElement>(null);
  const run = useRef<PlaybackRun | null>(null);
  const playAttempt = useRef(0);
  const [verse, setVerse] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    const player = audio.current;
    return () => {
      run.current = null;
      player?.pause();
    };
  }, []);

  function stop() {
    run.current = null;
    playAttempt.current++;
    audio.current?.pause();
    setPlaying(false);
    setVerse(null);
    setError(false);
  }

  function fail() {
    setPlaying(false);
    setError(true);
  }

  async function play() {
    const player = audio.current;
    if (!player) return;
    const attempt = ++playAttempt.current;
    setError(false);
    try {
      await player.play();
    } catch {
      if (audio.current === player && run.current && attempt === playAttempt.current) fail();
    }
  }

  function playTrack(cursor: PlaybackRun) {
    const player = audio.current;
    if (!player) return;
    const key = ayahKeys[cursor.index];
    const [surah, ayah] = key.split(":").map(Number);
    const source = reciters[cursor.plan.reciter].audioUrl(surah, ayah);
    if (player.src !== source) player.src = source;
    else player.currentTime = 0;
    player.playbackRate = cursor.plan.speed;
    setVerse(key);
    onTrack(key);
    void play();
  }

  function start(plan: PlaybackPlan) {
    const start = ayahIndex(plan.from);
    const end = ayahIndex(plan.to);
    if (start < 0 || end < start) return;
    const cursor = { plan, start, end, index: start, ayahPass: 1, rangePass: 1 };
    run.current = cursor;
    playTrack(cursor);
  }

  function toggle(plan: PlaybackPlan) {
    const player = audio.current;
    if (!player) return;
    if (run.current && verse === plan.from) {
      if (player.paused) void play();
      else {
        playAttempt.current++;
        player.pause();
      }
    } else {
      start(plan);
    }
  }

  function advance() {
    const cursor = run.current;
    if (!cursor) return;
    if (cursor.ayahPass < cursor.plan.ayahRepeat) {
      cursor.ayahPass++;
    } else if (cursor.index < cursor.end) {
      cursor.ayahPass = 1;
      cursor.index++;
    } else if (cursor.rangePass < cursor.plan.rangeRepeat) {
      cursor.ayahPass = 1;
      cursor.rangePass++;
      cursor.index = cursor.start;
    } else {
      stop();
      return;
    }
    playTrack(cursor);
  }

  return {
    audio, verse, playing, error, start, stop, toggle, advance,
    markPlaying: () => { if (run.current) setPlaying(true); },
    markPaused: () => setPlaying(false),
    markError: () => { if (run.current) fail(); },
  };
}
