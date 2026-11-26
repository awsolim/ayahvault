import { useCallback } from "react";
import { useSessionState } from "./useSessionState";
import { useRandomVerse } from "./useRandomVerse";
import {
  defaultCustomConfig,
  validMode,
  type CustomConfig,
  type MemoConfig,
  type MemoMode,
} from "../practiceModel";
export function useMemoSession() {
  const [mode, setMode] = useSessionState<MemoMode>("mode", null, validMode);
  const [rangeStart, setRangeStart] = useSessionState("rangeStart", "");
  const [rangeEnd, setRangeEnd] = useSessionState("rangeEnd", "");
  const [useMultiRange, setUseMultiRange] = useSessionState(
    "useMultiRange",
    false,
  );
  const [customConfig, setCustomConfig] = useSessionState<CustomConfig>(
    "customConfig",
    defaultCustomConfig,
  );
  const [partialMode, setPartialMode] = useSessionState("partialMode", false);
  const [partialWordCount, setPartialWordCount] = useSessionState(
    "partialWordCount",
    1,
  );
  const [previewMode, setPreviewMode] = useSessionState<"text" | "audio">(
    "previewMode",
    "text",
  );
  const [audioPartialSeconds, setAudioPartialSeconds] = useSessionState(
    "audioPartialSeconds",
    5,
  );
  const [showInfo, setShowInfo] = useSessionState("showInfo", false);
  const [hasInteracted, setHasInteracted] = useSessionState(
    "hasInteracted",
    false,
  );
  const random = useRandomVerse();
  const { generateRandomVerse } = random;
  const generate = useCallback(
    (keepCurrentOnError = false) => {
      if (!mode) return null;
      setHasInteracted(true);
      return generateRandomVerse(
        { mode, rangeStart, rangeEnd, useMultiRange, customConfig },
        keepCurrentOnError,
      );
    },
    [
      mode,
      rangeStart,
      rangeEnd,
      useMultiRange,
      customConfig,
      generateRandomVerse,
      setHasInteracted,
    ],
  );
  function configure(config: MemoConfig) {
    setMode(config.mode);
    setRangeStart(config.rangeStart);
    setRangeEnd(config.rangeEnd);
    setUseMultiRange(config.useMultiRange);
    setCustomConfig(config.customConfig);
  }
  return {
    ...random,
    mode,
    setMode,
    rangeStart,
    setRangeStart,
    rangeEnd,
    setRangeEnd,
    useMultiRange,
    setUseMultiRange,
    customConfig,
    setCustomConfig,
    partialMode,
    setPartialMode,
    partialWordCount,
    setPartialWordCount,
    previewMode,
    setPreviewMode,
    audioPartialSeconds,
    setAudioPartialSeconds,
    showInfo,
    setShowInfo,
    hasInteracted,
    setHasInteracted,
    generate,
    configure,
  };
}
