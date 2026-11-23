import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Dialog from "../../library/Dialog";
import { reference, verseText } from "../../library/quran";
import { cachedAyahTranslation, getAyahTranslation } from "../../lib/ayahTranslation";

function Translation({ verse }: { verse: string }) {
  const [text, setText] = useState(() => cachedAyahTranslation(verse));
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getAyahTranslation(verse, controller.signal)
      .then((value) => { if (!controller.signal.aborted) setText(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [verse, attempt]);

  if (error) return <button className="library-text-button" onClick={() => { setError(false); setAttempt(attempt + 1); }}>Translation unavailable. Try again</button>;
  if (!text) return <p role="status">Loading translation…</p>;
  return <><p dir="ltr" lang="en">{text}</p><p className="library-muted">Sahih International</p></>;
}

export default function TranslationDrawer({ verse, previous, next, go, close }: {
  verse: string;
  previous?: string;
  next?: string;
  go: (ayah: string) => void;
  close: () => void;
}) {
  const [tab, setTab] = useState<"translation" | "tafsir">("translation");
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const start = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  useLayoutEffect(() => {
    if (panel.current) panel.current.scrollTop = 0;
  }, [verse]);

  return (
    <Dialog title="Ayah Information" className="ayah-information-drawer" close={close}>
      <div className="ayah-book">
        <div className="ayah-book-tabs" role="tablist" aria-label="Ayah commentary" onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const selected = event.key === "Home" || (event.key !== "End" && tab === "tafsir") ? "translation" : "tafsir";
          setTab(selected);
          const buttons = event.currentTarget.querySelectorAll("button");
          buttons[selected === "translation" ? 0 : 1]?.focus();
        }}>
          {(["translation", "tafsir"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={id + "-" + item}
              aria-controls={id + "-" + item + "-panel"}
              aria-selected={tab === item}
              tabIndex={tab === item ? 0 : -1}
              onClick={() => setTab(item)}
            >
              {item === "translation" ? "Translation" : "Tafsir"}
            </button>
          ))}
        </div>
        <div
          ref={panel}
          className="ayah-translation-panel"
          id={id + "-translation-panel"}
          role="tabpanel"
          aria-labelledby={id + "-translation"}
          hidden={tab !== "translation"}
          tabIndex={0}
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            suppressClick.current = false;
            start.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
          }}
          onPointerCancel={() => { start.current = null; }}
          onPointerUp={(event) => {
            const origin = start.current;
            start.current = null;
            if (!origin || event.pointerId !== origin.id) return;
            const dx = event.clientX - origin.x;
            if (Math.abs(dx) < 45 || Math.abs(dx) <= Math.abs(event.clientY - origin.y)) return;
            suppressClick.current = true;
            const target = dx > 0 ? next : previous;
            if (target) go(target);
          }}
          onClickCapture={(event) => {
            if (!suppressClick.current || event.detail === 0) return;
            suppressClick.current = false;
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <p className="ayah-translation-reference" aria-live="polite">{reference(verse)}</p>
          <p className="ayah-translation-arabic" dir="rtl" lang="ar">{verseText(verse)}</p>
          <Translation key={verse} verse={verse} />
          <nav className="ayah-translation-navigation" aria-label="Translation ayah navigation">
            <button type="button" className="library-text-button" disabled={!previous} onClick={() => previous && go(previous)}><ChevronLeft size={17} />Previous ayah</button>
            <button type="button" className="library-text-button" disabled={!next} onClick={() => next && go(next)}>Next ayah<ChevronRight size={17} /></button>
          </nav>
        </div>
        <div className="ayah-tafsir-panel" id={id + "-tafsir-panel"} role="tabpanel" aria-labelledby={id + "-tafsir"} hidden={tab !== "tafsir"} />
      </div>
    </Dialog>
  );
}
