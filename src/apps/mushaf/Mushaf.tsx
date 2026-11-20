import { pageOffset, pageAtOffset } from './paging';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import chapters from '../../assets/chapters.json';
import Seo from '../../lib/Seo';

type Word = { id: number; code_v2: string; page_number: number; line_number: number; position: number };
type Verse = { verse_key: string; words: Word[] };
const API = 'https://api.quran.com/api/v4/verses';
const supported = import.meta.env.VITE_QURAN_CONTENT_API === 'supported';
const pages = Array.from({ length: 604 }, (_, i) => 604 - i);
const cache = new Map<number, Verse[]>();
const fonts = new Map<number, Promise<FontFace>>();
function validPage(n: number) { return Number.isInteger(n) && n >= 1 && n <= 604; }
function savedPage() { try { const n = Number(localStorage.getItem('ayahvault-last-page')); return validPage(n) ? n : 1; } catch { return 1; } }
async function getPage(page: number, signal: AbortSignal): Promise<Verse[]> {
  if (cache.has(page)) return cache.get(page)!;
  const url = supported ? '/api/mushaf?page=' + page : API + '/by_page/' + page + '?mushaf=1&words=true&word_fields=code_v2,line_number&page=1&per_page=50';
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Page unavailable');
  const data = await response.json();
  if (!Array.isArray(data.verses) || !data.verses.length || data.pagination?.next_page) throw new Error('Incomplete page data');
  const words = data.verses.flatMap((v: Verse) => v.words).filter((w: Word) => w.page_number === page);
  if (!words.length || words.some((w: Word) => !w.code_v2 || !Number.isInteger(w.line_number) || w.line_number < 1 || w.line_number > 15)) throw new Error('Invalid page data');
  cache.set(page, data.verses);
  if (cache.size > 14) cache.delete(cache.keys().next().value!);
  return data.verses;
}
async function loadFont(page: number) {
  if (!fonts.has(page)) {
    const font = new FontFace('madinah-' + page, 'url(https://quran.com/fonts/quran/hafs/v2/woff2/p' + page + '.woff2)');
    fonts.set(page, font.load().then(loaded => { document.fonts.add(loaded); return loaded; }).catch(error => { fonts.delete(page); throw error; }));
  }
  return fonts.get(page)!;
}
function PageContent({ page, highlight }: { page: number; highlight: string | null }) {
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [fontSize, setFontSize] = useState(24);
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setVerses(null);
    Promise.all([getPage(page, controller.signal), loadFont(page)]).then(([data]) => { if (!controller.signal.aborted) setVerses(data); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [page, retry]);
  const { lines, headings } = useMemo(() => {
    const lines: { word: Word; key: string }[][] = Array.from({ length: page <= 2 ? 8 : 15 }, () => []);
    const headings = new Map<number, { type: 'surah' | 'basmala'; surah: number }>();
    for (const verse of verses || []) {
      for (const word of verse.words) if (word.page_number === page) lines[word.line_number - 1]?.push({ word, key: verse.verse_key });
      const [surah, ayah] = verse.verse_key.split(':').map(Number);
      const first = verse.words.find(w => w.page_number === page && w.position === 1);
      if (ayah === 1 && first) {
        if (surah === 1 || surah === 9) headings.set(first.line_number - 1, { type: 'surah', surah });
        else { headings.set(first.line_number - 2, { type: 'surah', surah }); headings.set(first.line_number - 1, { type: 'basmala', surah }); }
      }
    }
    return { lines, headings };
  }, [verses, page]);
  useLayoutEffect(() => {
    if (!verses || !surface.current) return;
    const canvas = document.createElement('canvas'); const context = canvas.getContext('2d');
    const fit = () => {
      if (!surface.current || !context) return;
      context.font = '100px madinah-' + page;
      const widest = Math.max(...lines.map(line => context.measureText(line.map(x => x.word.code_v2).join(' ')).width), 1);
      const width = surface.current.clientWidth;
      const height = surface.current.clientHeight;
      setFontSize(Math.min(width * 100 / widest, height / lines.length * .72));
    };
    fit(); const observer = new ResizeObserver(fit); observer.observe(surface.current);
    return () => observer.disconnect();
  }, [verses, lines, page]);
  if (error) return <div className="page-message" role="alert"><p>Couldn’t load page {page}.</p><button onClick={() => setRetry(n => n + 1)}>Try again</button></div>;
  if (!verses) return <div className="page-message" role="status">Loading page {page}…</div>;
  return <div className={'mushaf-sheet' + (page <= 2 ? ' opening-sheet' : '')}>
    <div ref={surface} className="page-lines" style={{ gridTemplateRows: 'repeat(' + lines.length + ', 1fr)', fontSize, fontFamily: 'madinah-' + page }}>
      {lines.map((line, i) => { const heading = headings.get(i + 1); return <div key={i} className="quran-line" dir="rtl" lang="ar">
        {line.length ? line.map(({ word, key }) => <span key={word.id} className={key === highlight ? 'ayah-mark' : undefined}>{word.code_v2}{' '}</span>) : heading?.type === 'surah' ? <span className="surah-heading">{chapters[heading.surah - 1].arabic}</span> : heading?.type === 'basmala' ? <span className="page-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span> : null}
      </div>; })}
    </div>
  </div>;
}
function ReadingStream({ initial, target }: { initial: number; target: string | null }) {
  const scroll = useRef<HTMLDivElement>(null);
  const current = useRef(initial);
  const [active, setActive] = useState(initial);
  const [highlight, setHighlight] = useState(target);
  const location = useLocation();
  const fromMemoBuddy = location.state?.from === 'memobuddy';
  useLayoutEffect(() => {
    const element = scroll.current!;
    element.scrollLeft = pageOffset(initial, element.clientWidth);
    const observer = new ResizeObserver(() => { element.scrollLeft = pageOffset(current.current, element.clientWidth); });
    observer.observe(element);
    return () => observer.disconnect();
  }, [initial]);
  function onScroll() {
    const element = scroll.current!;
    const n = pageAtOffset(element.scrollLeft, element.clientWidth);
    if (n === current.current) return;
    current.current = n; setActive(n);
    try { localStorage.setItem('ayahvault-last-page', String(n)); } catch { /* Optional history. */ }
  }
  useEffect(() => { try { localStorage.setItem('ayahvault-last-page', String(initial)); } catch { /* Optional history. */ } }, [initial]);
  const chapter = [...chapters].reverse().find(c => c.page <= active);
  return <div className="reading-view">
    <Seo title={chapter?.name || 'Mushaf'} />
    <header className="reader-toolbar"><Link to={fromMemoBuddy ? '/memobuddy' : '/'} className="reader-index-link" aria-label={fromMemoBuddy ? 'Back to MemoBuddy' : 'Back to surah index'}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="1.6"/></svg><span>{fromMemoBuddy ? 'MemoBuddy' : 'Surahs'}</span></Link><span className="reader-title">{chapter?.name}</span>
      <div className="reader-actions">{highlight && <button onClick={() => setHighlight(null)} className="clear-highlight" aria-label="Clear ayah highlight">×</button>}<label className="page-selector"><select aria-label="Mushaf page" value={active} onChange={event => {
        const n = Number(event.target.value);
        if (!validPage(n) || !scroll.current) return;
        current.current = n; setActive(n);
        scroll.current.scrollTo({ left: pageOffset(n, scroll.current.clientWidth) });
        try { localStorage.setItem('ayahvault-last-page', String(n)); } catch { /* Optional history. */ }
      }}>{Array.from({ length: 604 }, (_, i) => <option key={i + 1} value={i + 1}>Page {i + 1}</option>)}</select><span className="folio-total">/ 604</span></label></div>
    </header>
    <div ref={scroll} className="reading-stream" onScroll={onScroll} tabIndex={0} aria-label="Quran pages. Scroll horizontally; Al-Fatiha is at the right end.">
      {pages.map(n => <section key={n} className="reading-page" aria-label={'Page ' + n}>{Math.abs(n - active) <= 2 && <PageContent page={n} highlight={highlight} />}</section>)}
    </div>
  </div>;
}
export default function Mushaf() {
  const location = useLocation();
  const [params] = useSearchParams();
  const target = params.get('ayah');
  const surah = Number(params.get('surah'));
  const page = Number(params.get('page'));
  const initial = chapters.find(c => c.id === surah)?.page || (validPage(page) ? page : savedPage());
  const [resolved, setResolved] = useState<{ key: string; page: number } | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!target) return;
    setError(false);
    const controller = new AbortController();
    const [chapter, verse] = target.split(':').map(Number);
    if (!chapters[chapter - 1] || !Number.isInteger(verse) || verse < 1 || verse > chapters[chapter - 1].verses) { setError(true); return; }
    const url = supported ? '/api/mushaf?ayah=' + encodeURIComponent(target) : API + '/by_key/' + target + '?mushaf=1&words=true&word_fields=code_v2,line_number';
    fetch(url, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(data => { const n = data.verse?.words?.[0]?.page_number; if (!validPage(n)) throw new Error(); if (!controller.signal.aborted) setResolved({ key: target, page: n }); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [target, retry]);
  if (target && resolved?.key !== target) return <div className="reader-resolving"><Link to={location.state?.from === 'memobuddy' ? '/memobuddy' : '/'}>{location.state?.from === 'memobuddy' ? 'MemoBuddy' : 'Surahs'}</Link>{error ? <div role="alert"><p>Couldn’t open this ayah.</p><button onClick={() => setRetry(n => n + 1)}>Try again</button></div> : <p role="status">Opening ayah…</p>}</div>;
  return <ReadingStream key={target || String(initial)} initial={target ? resolved!.page : initial} target={target} />;
}
