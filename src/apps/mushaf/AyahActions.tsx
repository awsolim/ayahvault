import { useState, type CSSProperties } from "react";
import { BookOpen, Bookmark, Link2, MapPin, MessageSquare, Pause, Play, Plus, Settings } from "lucide-react";
import Dialog from "../../library/Dialog";
import { markerKey, readDeviceValue } from "./readerPosition";

export default function AyahActions({ verse, page, position, playing, audioError, toggleAudio, openSettings, openBook, newEntry }: {
  verse: string;
  page: number;
  position: CSSProperties;
  playing: boolean;
  audioError: boolean;
  toggleAudio: () => void;
  openSettings: () => void;
  openBook: () => void;
  newEntry: () => void;
}) {
  const [panel, setPanel] = useState<"add" | "comment" | null>(null);
  const [saveError, setSaveError] = useState(false);
  const bookmarkKey = "ayahvault-bookmark:" + verse;
  const commentKey = "ayahvault-ayah-comment:" + verse;
  const [bookmarked, setBookmarked] = useState(() => !!readDeviceValue(bookmarkKey));
  const [savedComment, setSavedComment] = useState(() => readDeviceValue(commentKey));
  const [comment, setComment] = useState(savedComment);
  const [marker, setMarker] = useState(() => readDeviceValue(markerKey));
  const close = () => { setPanel(null); setSaveError(false); };

  function store(key: string, value: string) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
      setSaveError(false);
      return true;
    } catch {
      setSaveError(true);
      return false;
    }
  }

  const error = saveError && <p role="alert" className="library-error">Couldn’t save on this device. Try again.</p>;
  const markerValue = page + ":" + verse;
  return (
    <div className="ayah-action-anchor" style={position} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>
      <aside className="ayah-action-bar" aria-label={"Actions for ayah " + verse}>
        <button type="button" title={playing ? "Pause ayah" : "Play ayah"} aria-label={playing ? "Pause ayah" : "Play ayah"} onClick={toggleAudio}>
          {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
        </button>
        <button type="button" title="Play settings" aria-label="Play settings" onClick={openSettings}><span className="play-settings-icon"><Play size={18} fill="currentColor" /><Settings size={13} /></span></button>
        <button type="button" title="Ayah Information" aria-label="Ayah Information" onClick={openBook}><BookOpen size={18} /></button>
        <button type="button" title="Add to this ayah" aria-label="Add to this ayah" onClick={() => setPanel("add")}><Plus size={21} /></button>
      </aside>
      {audioError && <p role="status" className="ayah-audio-error">Audio unavailable. Tap play to retry.</p>}
      {panel === "add" && (
        <Dialog title={"Add to ayah " + verse} close={close}>
          {error}
          <div className="ayah-add-options">
            <button type="button" onClick={() => { close(); newEntry(); }}><Link2 size={18} />Mutashabihat</button>
            <button type="button" onClick={() => { setComment(savedComment); setSaveError(false); setPanel("comment"); }}><MessageSquare size={18} />{savedComment ? "Edit comment" : "Add comment"}</button>
            <button type="button" onClick={() => { if (store(bookmarkKey, bookmarked ? "" : "1")) setBookmarked(!bookmarked); }}><Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />{bookmarked ? "Remove bookmark" : "Bookmark ayah"}</button>
            <button type="button" disabled={marker === markerValue} onClick={() => { if (store(markerKey, markerValue)) setMarker(markerValue); }}><MapPin size={18} />{marker === markerValue ? "Reading marker is here" : "Move reading marker here"}</button>
          </div>
        </Dialog>
      )}
      {panel === "comment" && (
        <Dialog title={"Comment · " + verse} close={close}>
          <form onSubmit={(event) => {
            event.preventDefault();
            const value = comment.trim();
            if (store(commentKey, value)) {
              setSavedComment(value);
              close();
            }
          }}>
            <label className="library-field">
              <span>Ayah comment</span>
              <textarea autoFocus rows={4} dir="auto" maxLength={10000} value={comment} onChange={(event) => setComment(event.target.value)} />
            </label>
            {error}
            <button className="library-primary" type="submit">Save comment</button>
          </form>
        </Dialog>
      )}
    </div>
  );
}
