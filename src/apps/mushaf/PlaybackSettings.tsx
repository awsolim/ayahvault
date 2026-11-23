import { Crosshair } from "lucide-react";
import { useState } from "react";
import Dialog from "../../library/Dialog";
import { playbackRepeats, playbackSpeeds, reciters, type PlaybackPlan } from "./playback";
import { ayahIndex, readAyahReference } from "./readerPosition";

export default function PlaybackSettings({ draft, change, close, pick, apply }: {
  draft: PlaybackPlan;
  change: (draft: PlaybackPlan) => void;
  close: () => void;
  pick: () => void;
  apply: (plan: PlaybackPlan, play: boolean) => void;
}) {
  const [error, setError] = useState("");
  function submit(play: boolean) {
    const from = readAyahReference(draft.from);
    const to = readAyahReference(draft.to);
    if (!from || !to) {
      setError("Enter both ayahs as surah:ayah, such as 2:255.");
      return;
    }
    if (ayahIndex(to) < ayahIndex(from)) {
      setError("Choose an end ayah at or after the start ayah.");
      return;
    }
    apply({ ...draft, from, to }, play);
  }

  return (
    <Dialog title="Play settings" close={close}>
      <form className="play-settings" onSubmit={(event) => {
        event.preventDefault();
        submit((event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "play");
      }}>
        <label className="library-field">
          Reciter
          <select value={draft.reciter} onChange={(event) => change({ ...draft, reciter: event.target.value as PlaybackPlan["reciter"] })}>
            {Object.entries(reciters).map(([id, reciter]) => <option key={id} value={id}>{reciter.name}</option>)}
          </select>
        </label>
        <fieldset>
          <legend>Playback range</legend>
          <p className="library-muted" id="play-range-format">Enter each reference as surah:ayah, or pick both ayahs from the Mushaf.</p>
          <div className="play-settings-fields">
            <label className="library-field">
              From ayah
              <input aria-describedby="play-range-format" value={draft.from} placeholder="2:255" onChange={(event) => change({ ...draft, from: event.target.value })} />
            </label>
            <label className="library-field">
              To ayah
              <input aria-describedby="play-range-format" value={draft.to} placeholder="2:257" onChange={(event) => change({ ...draft, to: event.target.value })} />
            </label>
          </div>
          <button type="button" className="library-text-button" onClick={pick}><Crosshair size={16} />Pick from Mushaf</button>
        </fieldset>
        <div className="play-settings-fields play-settings-options">
          <label className="library-field">
            Speed
            <select value={draft.speed} onChange={(event) => change({ ...draft, speed: Number(event.target.value) })}>
              {playbackSpeeds.map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
            </select>
          </label>
          <label className="library-field">
            Ayah repeat
            <select value={draft.ayahRepeat} onChange={(event) => change({ ...draft, ayahRepeat: Number(event.target.value) })}>
              {playbackRepeats.map((count) => <option key={count} value={count}>{count === 1 ? "Once" : count + " times"}</option>)}
            </select>
          </label>
          <label className="library-field">
            Range repeat
            <select value={draft.rangeRepeat} onChange={(event) => change({ ...draft, rangeRepeat: Number(event.target.value) })}>
              {playbackRepeats.map((count) => <option key={count} value={count}>{count === 1 ? "Once" : count + " times"}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="library-error" role="alert">{error}</p>}
        <div className="play-settings-actions">
          <button type="submit" className="library-text-button">Save settings</button>
          <button type="submit" className="library-primary" value="play">Play range</button>
        </div>
      </form>
    </Dialog>
  );
}
