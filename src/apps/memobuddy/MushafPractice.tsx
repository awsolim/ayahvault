import { useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronUp, Eye, RotateCcw } from "lucide-react";
import { useMemoSession } from "./hooks/useMemoSession";
import { useSessionState } from "./hooks/useSessionState";
import { usePreferences } from "../../preferences/Preferences";
import {
  continuationEnd,
  startPractice,
  verseKey,
  visibleInPractice,
  visibilityLabels,
  validVisibility,
  type MemoConfig,
  type MushafVisibility,
  type PracticeProgress,
} from "./practiceModel";
import { ayahIndex, ayahKeys } from "../mushaf/readerPosition";
import type { PracticeBinding } from "../mushaf/practiceTypes";
import unsupported from "../../assets/mushaf-partial-unsupported.json";
import Dialog from "../../library/Dialog";
import { ModeSelector } from "./components/ModeSelector";
import { poolFor } from "./hooks/useRandomVerse";
import { CustomSelection } from "./components/CustomSelection";

export default function MushafPractice({
  target,
  entryKey,
  children,
}: {
  target: string | null;
  entryKey: string;
  children: (practice: PracticeBinding) => ReactNode;
}) {
  const memo = useMemoSession();
  const { mushafVisibility, setMushafVisibility } = usePreferences();
  const [saved, setSaved] = useSessionState<PracticeProgress | null>(
    "mushafPractice",
    null,
    (value): value is PracticeProgress | null => {
      if (value === null) return true;
      const p = value as PracticeProgress;
      return (
        !!p &&
        typeof p.entryKey === "string" &&
        typeof p.questionId === "string" &&
        ayahIndex(p.anchor) >= 0 &&
        ayahIndex(p.through) >= ayahIndex(p.anchor) &&
        typeof p.active === "boolean" &&
        typeof p.showAll === "boolean" &&
        typeof p.promptRevealed === "boolean"
      );
    },
  );
  const [seed] = useState(() =>
    startPractice(
      target || (memo.randomVerse ? verseKey(memo.randomVerse) : "1:1"),
      entryKey,
    ),
  );
  const progress =
    saved && (!target || saved.entryKey === entryKey) ? saved : seed;
  useLayoutEffect(() => {
    if (saved !== progress) setSaved(progress);
  }, [saved, progress, setSaved]);
  const [settings, setSettings] = useState(false);
  const [message, setMessage] = useState("");
  const partial =
    progress.active &&
    memo.partialMode &&
    memo.previewMode === "text" &&
    !progress.promptRevealed &&
    !progress.showAll;
  const partialWords = partial
    ? unsupported.includes(progress.anchor)
      ? 0
      : Math.max(1, memo.partialWordCount)
    : null;
  const end = useMemo(
    () => continuationEnd(progress.anchor, memo.currentPool, ayahKeys),
    [progress.anchor, memo.currentPool],
  );
  const next =
    ayahIndex(progress.through) < ayahIndex(end)
      ? ayahKeys[ayahIndex(progress.through) + 1]
      : undefined;
  const visible = (key: string) =>
    visibleInPractice(key, progress, mushafVisibility, ayahIndex);
  const hasHiddenFollowing = mushafVisibility !== "all" && !progress.showAll;
  function newAyah() {
    const result = memo.generate(true);
    if (!result) {
      setMessage("Choose a valid generation range in MemoBuddy settings.");
      return;
    }
    setMessage("");
    setSaved(startPractice(verseKey(result), entryKey));
  }
  function reset() {
    setSaved({ ...startPractice(progress.anchor, entryKey), entryKey });
    setMessage("");
  }
  return children({
    active: progress.active,
    anchor: progress.anchor,
    questionId: progress.questionId,
    partialWords,
    visible,
    resumePage: progress.page,
    recordPage: (page) =>
      setSaved((p) => (p && p.page !== page ? { ...p, page } : p)),
    renderControls: (jump) =>
      progress.active && (
        <>
          <div
            className="memo-practice-bar"
            role="region"
            aria-label="In-mushaf MemoBuddy"
          >
            <button
              className="memo-practice-config"
              onClick={() => setSettings(true)}
              aria-haspopup="dialog"
              aria-expanded={settings}
            >
              MemoBuddy
              <ChevronUp size={15} />
            </button>
            {partial ? (
              <button
                onClick={() => setSaved({ ...progress, promptRevealed: true })}
              >
                Reveal Prompt
              </button>
            ) : hasHiddenFollowing ? (
              <button
                disabled={!next}
                onClick={() => {
                  if (!next) return;
                  setSaved({ ...progress, through: next });
                  jump(next);
                }}
              >
                {next ? "Reveal Next" : "End of Range"}
              </button>
            ) : (
              <button
                aria-label={
                  progress.showAll ? "Hide again" : "Change visibility"
                }
                onClick={() =>
                  progress.showAll
                    ? setSaved({ ...progress, showAll: false })
                    : setSettings(true)
                }
              >
                {progress.showAll ? "Hide Again" : "Visibility"}
              </button>
            )}
            <button className="memo-practice-new" onClick={newAyah}>
              New Ayah
            </button>
          </div>
          {message && (
            <p className="memo-practice-status" role="alert">
              {message}
            </p>
          )}
          {settings && (
            <PracticeSettings
              initial={{
                mode: memo.mode,
                rangeStart: memo.rangeStart,
                rangeEnd: memo.rangeEnd,
                useMultiRange: memo.useMultiRange,
                customConfig: structuredClone(memo.customConfig),
              }}
              visibility={mushafVisibility}
              partial={memo.partialMode && memo.previewMode === "text"}
              count={memo.partialWordCount}
              unsupported={partialWords === 0}
              close={() => setSettings(false)}
              apply={(config, visibility, partial, count) => {
                memo.configure(config);
                setMushafVisibility(visibility);
                memo.setPartialMode(partial);
                memo.setPartialWordCount(count);
                if (partial) memo.setPreviewMode("text");
                setSaved({
                  ...progress,
                  showAll: false,
                  promptRevealed:
                    partial !== memo.partialMode ||
                    count !== memo.partialWordCount
                      ? false
                      : progress.promptRevealed,
                });
                setSettings(false);
              }}
              revealAll={() => {
                setSaved({ ...progress, showAll: !progress.showAll });
                setSettings(false);
              }}
              allShown={progress.showAll}
              reset={() => {
                reset();
                jump(progress.anchor);
                setSettings(false);
              }}
              end={() => {
                setSaved({ ...progress, active: false, showAll: false });
                setSettings(false);
              }}
            />
          )}
        </>
      ),
  });
}
function PracticeSettings({
  initial,
  visibility,
  partial,
  count,
  unsupported,
  close,
  apply,
  revealAll,
  allShown,
  reset,
  end,
}: {
  initial: MemoConfig;
  visibility: MushafVisibility;
  partial: boolean;
  count: number;
  unsupported: boolean;
  close: () => void;
  apply: (
    config: MemoConfig,
    visibility: MushafVisibility,
    partial: boolean,
    count: number,
  ) => void;
  revealAll: () => void;
  allShown: boolean;
  reset: () => void;
  end: () => void;
}) {
  const [config, setConfig] = useState(initial);
  const [visibilityDraft, setVisibility] = useState(visibility);
  const [partialDraft, setPartial] = useState(partial);
  const [countDraft, setCount] = useState(count);
  const [error, setError] = useState("");
  const max = config.mode === "surah" ? 114 : 30;
  function submit() {
    try {
      poolFor(config);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check the generation range.");
      return;
    }
    if (!config.mode) {
      setError("Choose a generation mode.");
      return;
    }
    if (
      (config.mode === "surah" || config.mode === "juz") &&
      (!/^\d+$/.test(config.rangeStart) ||
        Number(config.rangeStart) < 1 ||
        Number(config.rangeStart) > max ||
        (config.useMultiRange &&
          (!/^\d+$/.test(config.rangeEnd) ||
            Number(config.rangeEnd) < 1 ||
            Number(config.rangeEnd) > max)))
    ) {
      setError(
        "Enter a valid " +
          (config.mode === "surah" ? "surah" : "juz") +
          " range.",
      );
      return;
    }
    if (!Number.isInteger(countDraft) || countDraft < 1 || countDraft > 1000) {
      setError("Choose a word count from 1 to 1,000.");
      return;
    }
    apply(config, visibilityDraft, partialDraft, countDraft);
  }
  return (
    <Dialog title="MemoBuddy" close={close}>
      <div className="practice memo-practice-settings">
        <ModeSelector
          mode={config.mode}
          onSelect={(mode) => setConfig({ ...config, mode })}
        />
        {(config.mode === "surah" || config.mode === "juz") && (
          <div className="memo-practice-range">
            <label>
              {config.mode === "surah" ? "From Surah" : "From Juz"}
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                value={config.rangeStart}
                onChange={(e) =>
                  setConfig({ ...config, rangeStart: e.target.value })
                }
              />
            </label>
            <label>
              To
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={max}
                value={
                  config.useMultiRange ? config.rangeEnd : config.rangeStart
                }
                onChange={(e) =>
                  setConfig({
                    ...config,
                    useMultiRange: true,
                    rangeEnd: e.target.value,
                  })
                }
              />
            </label>
          </div>
        )}
        {config.mode === "custom" && (
          <CustomSelection
            config={config.customConfig}
            setConfig={(
              change:
                | typeof config.customConfig
                | ((
                    previous: typeof config.customConfig,
                  ) => typeof config.customConfig),
            ) =>
              setConfig((prev) => ({
                ...prev,
                customConfig:
                  typeof change === "function"
                    ? change(prev.customConfig)
                    : change,
              }))
            }
          />
        )}
        <p className="library-muted">
          Range changes apply to New Ayah. Reveals continue within the current
          question’s range.
        </p>
        <label className="library-field">
          Mushaf Visibility
          <select
            aria-label="Mushaf Visibility"
            value={visibilityDraft}
            onChange={(e) => {
              if (validVisibility(e.target.value))
                setVisibility(e.target.value);
            }}
          >
            {Object.entries(visibilityLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="memo-practice-partial">
          <input
            type="checkbox"
            checked={partialDraft}
            onChange={(e) => setPartial(e.target.checked)}
          />
          Partial Prompt
        </label>
        {partialDraft && (
          <label className="library-field">
            Visible Words
            <input
              aria-label="Visible Words"
              type="number"
              min={1}
              max={1000}
              inputMode="numeric"
              value={countDraft}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>
        )}
        {unsupported && partialDraft && (
          <p className="library-muted">
            This ayah’s word boundaries differ between editions. Its prompt
            stays concealed until you choose Reveal Prompt.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
        <button className="library-primary full-button" onClick={submit}>
          Apply Settings
        </button>
        <div className="memo-practice-tools">
          <button onClick={revealAll}>
            <Eye size={17} />
            {allShown ? "Hide Again" : "Reveal All"}
          </button>
          <button onClick={reset}>
            <RotateCcw size={16} />
            Reset Reveals
          </button>
        </div>
        <button className="library-text-button" onClick={end}>
          End Practice
        </button>
      </div>
    </Dialog>
  );
}
