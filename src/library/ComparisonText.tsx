import { Fragment } from "react";
import type { Mark, Span } from "./model";
import { verseWords } from "./quran";

export default function ComparisonText({ verse, marks, selection, onWord }: {
  verse: string;
  marks: Mark[];
  selection?: Span | null;
  onWord?: (position: number) => void;
}) {
  const runs: { mark?: Mark; selected: boolean; start: number; words: string[] }[] = [];
  verseWords(verse).forEach((word, index) => {
    const position = index + 1;
    const selected = selection?.verse === verse && selection.start <= position && selection.end >= position;
    const mark = selected ? undefined : marks.find((item) => item.spans.some(
      (span) => span.verse === verse && span.start <= position && span.end >= position,
    ));
    const previous = runs.at(-1);
    if (previous && previous.mark === mark && previous.selected === selected) {
      previous.words.push(word);
    } else {
      runs.push({ mark, selected, start: position, words: [word] });
    }
  });

  return (
    <p className="comparison-arabic" dir="rtl" lang="ar">
      {runs.map(({ mark, selected, start, words }, index) => (
        <Fragment key={start}>
          {index > 0 && " "}
          <span
            className={selected ? "selected-phrase-range" : mark ? "marked-phrase" : undefined}
            style={!selected && mark ? { backgroundColor: mark.color + "38" } : undefined}
            title={mark?.label}
          >
            {onWord ? words.map((word, offset) => {
              const position = start + offset;
              return (
                <Fragment key={position}>
                  {offset > 0 && " "}
                  <button
                    type="button"
                    aria-label={word + ", word " + position + ", " + verse + (mark ? ", " + mark.label : "")}
                    aria-pressed={selected}
                    onClick={() => onWord(position)}
                  >
                    {word}
                  </button>
                </Fragment>
              );
            }) : words.join(" ")}
          </span>
        </Fragment>
      ))}
    </p>
  );
}
