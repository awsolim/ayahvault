import Spinner from '../../components/ui/Spinner';
import { imagePoint, nearestAyah } from './selection';
import { Languages, BookOpen, Bookmark, MessageSquare, X, Link2 } from 'lucide-react';
import { pageOffset, pageAtOffset } from './paging';
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import chapters from '../../assets/chapters.json';
import ayahPages from '../../assets/mushaf-pages.json';
import Seo from '../../lib/Seo';
import { useLibrary } from '../../library/LibraryProvider';
const AyahLinks = lazy(() => import('../../library/AyahLinks'));

type Region = [number, number, number, number, number, number, number];
type PageData = { width: number; height: number; regions: Region[]; endings?: [number, number, number, number, number, number][] };
const pages = Array.from({ length: 604 }, (_, i) => 604 - i);
const cache = new Map<number, PageData>();
const artworkPath = (page: number) => '/mushaf/dar-al-marefa/' + page;
function validPage(n: number) { return Number.isInteger(n) && n >= 1 && n <= 604; }
function savedPage() { try { const n = Number(localStorage.getItem('ayahvault-last-page')); return validPage(n) ? n : 1; } catch { return 1; } }
async function getPage(page: number, signal: AbortSignal): Promise<PageData> {
  if (cache.has(page)) return cache.get(page)!;
  const response = await fetch(artworkPath(page) + '.json?layout=2', { signal });
  if (!response.ok) throw new Error('Page unavailable');
  const data: PageData = await response.json();
  if (!(data.width > 0 && data.height > 0 && data.regions?.length)) throw new Error('Invalid page data');
  cache.set(page, data);
  if (cache.size > 14) cache.delete(cache.keys().next().value!);
  return data;
}
function PageContent({ page, highlight, onSelect, onTap, onEntry }: { page: number; highlight: string | null; onSelect: (key: string) => void; onTap: () => void; onEntry: (key: string) => void }) {
  const { rows } = useLibrary();
  const linked = new Set(rows.flatMap(row => row.entry.passages.map(p => p.verse)));
  const [data, setData] = useState<PageData | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const surface = useRef<HTMLDivElement>(null);
  const hold = useRef<{ id: number; x: number; y: number; timer: number; moved: boolean; selected: boolean } | null>(null);
  function cancelHold() { if (hold.current) window.clearTimeout(hold.current.timer); hold.current = null; }
  useEffect(() => cancelHold, []);
  function selectAt(x: number, y: number) {
    if (!surface.current) return;
    if (!data || !imageReady) return;
    const bounds = surface.current.getBoundingClientRect();
    const point = imagePoint(x, y, bounds, data.width, data.height);
    const boxes = data.regions.map(([surah, ayah, , x1, y1, x2, y2]) => ({ key: surah + ':' + ayah, left: x1, right: x2, top: y1, bottom: y2 }));
    const key = nearestAyah(point.x, point.y, boxes);
    if (key) onSelect(key);
  }
  useEffect(() => {
    const controller = new AbortController();
    setError(false); setData(null); setImageReady(false);
    getPage(page, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [page, retry]);
  const regions = useMemo(() => data?.regions || [], [data]);
  if (error) return <div className="page-message" role="alert"><p>Couldn’t load page {page}.</p><button onClick={() => setRetry(n => n + 1)}>Try again</button></div>;
  if (!data) return <div className="page-message"><Spinner colorClassName="reader-spinner" /></div>;
  return <div className="mushaf-sheet"
    onPointerDown={event => {
      cancelHold();
      if (!event.isPrimary || event.button !== 0) return;
      const point = { id: event.pointerId, x: event.clientX, y: event.clientY, timer: 0, moved: false, selected: false };
      point.timer = window.setTimeout(() => { if (hold.current === point && !point.moved) { point.selected = true; selectAt(point.x, point.y); } }, 450);
      hold.current = point;
    }}
    onPointerMove={event => { const point = hold.current; if (point && point.id === event.pointerId && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 10) { point.moved = true; window.clearTimeout(point.timer); } }}
    onPointerUp={event => { const point = hold.current; if (!point || point.id !== event.pointerId) return; window.clearTimeout(point.timer); if (!point.moved && !point.selected) onTap(); hold.current = null; }}
    onPointerCancel={cancelHold} onPointerLeave={cancelHold} onContextMenu={event => event.preventDefault()}>
    <div ref={surface} className="mushaf-artwork">
      <img key={page + ':' + retry} className="mushaf-page-image" src={artworkPath(page) + '.png'} alt={'Quran, page ' + page} draggable={false} onLoad={() => setImageReady(true)} onError={() => setError(true)} style={{ opacity: imageReady ? 1 : 0 }} />
      {imageReady ? <svg className="mushaf-regions" viewBox={'0 0 ' + data.width + ' ' + data.height} aria-label={'Select an ayah on page ' + page}>
        {regions.map(([surah, ayah, line, x1, y1, x2, y2], index) => {
          const key = surah + ':' + ayah;
          const first = regions.findIndex(r => r[0] === surah && r[1] === ayah) === index;
          return <rect key={key + ':' + line} x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={4} className={key === highlight ? 'selected-region' : undefined} role={first ? 'button' : undefined} tabIndex={first ? 0 : undefined} aria-label={first ? 'Select ayah ' + key : undefined} aria-hidden={!first || undefined} aria-pressed={first ? key === highlight : undefined} onKeyDown={event => { if (first && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); onSelect(key); } }} />;
        })}
        {data.endings?.filter(([s,a]) => linked.has(s + ':' + a)).map(([s,a,x1,y1,x2]) => {
          const key=s+':'+a;
          return <g key={key} className="mushaf-library-marker" transform={'translate(' + ((x1+x2)/2) + ' ' + (y1+12) + ')'} role="button" tabIndex={0} aria-label={'Open Mutashabihat for '+key} onPointerDown={e=>e.stopPropagation()} onPointerUp={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onEntry(key);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();onEntry(key);}}}><circle r={28} fill="transparent"/><rect x={-16} y={-7} width={21} height={14} rx={7}/><rect x={-4} y={-7} width={21} height={14} rx={7}/></g>;
        })}
      </svg> : <div className="page-image-loading"><Spinner colorClassName="reader-spinner" /></div>}
    </div>
  </div>;
}
function ReadingStream({ initial, target }: { initial: number; target: string | null }) {
  const location = useLocation();
  const scroll = useRef<HTMLDivElement>(null);
  const current = useRef(initial);
  const [active, setActive] = useState(initial);
  const [highlight, setHighlight] = useState<string | null>(target || location.state?.readerHighlight || null);
  const [selected, setSelected] = useState<string | null>(location.state?.readerSelected || null);
  const [entryVerse, setEntryVerse] = useState<string | null>(null);
  const [chromeOpen, setChromeOpen] = useState(location.state?.readerChromeOpen !== false);
  function clearSelection() { setSelected(null); setHighlight(null); }
  const fromMemoBuddy = location.state?.from === 'memobuddy';
  const fromLibrary = location.state?.from === 'library' && location.state?.entryId;
  const backPath = fromMemoBuddy ? '/memobuddy' : fromLibrary ? '/library/' + location.state.entryId : '/';
  const backLabel = fromMemoBuddy ? 'MemoBuddy' : fromLibrary ? 'Entry' : 'Surahs';
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
  return <div className={'reading-view' + (chromeOpen ? '' : ' chrome-hidden') + (selected ? ' has-ayah-selection' : '')} onPointerDownCapture={event => { event.currentTarget.dataset.keyboardFocus = 'false'; }} onKeyDownCapture={event => { if (event.key === 'Tab') event.currentTarget.dataset.keyboardFocus = 'true'; }} onKeyDown={event => { if (event.key === 'Escape') { clearSelection(); setChromeOpen(true); } }}>
    <Seo title={chapter?.name || 'Mushaf'} />
    <header className="reader-toolbar" aria-hidden={!chromeOpen} inert={!chromeOpen}><Link to={backPath} className="reader-index-link" aria-label={'Back to '+backLabel}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="1.6"/></svg><span>{backLabel}</span></Link><span className="reader-title">{chapter?.name}</span>
      <div className="reader-actions">{highlight && <button onClick={clearSelection} className="clear-highlight" aria-label="Clear ayah highlight">×</button>}<label className="page-selector"><select aria-label="Mushaf page" value={active} onChange={event => {
        const n = Number(event.target.value);
        if (!validPage(n) || !scroll.current) return;
        current.current = n; setActive(n);
        scroll.current.scrollTo({ left: pageOffset(n, scroll.current.clientWidth) });
        try { localStorage.setItem('ayahvault-last-page', String(n)); } catch { /* Optional history. */ }
      }}>{Array.from({ length: 604 }, (_, i) => <option key={i + 1} value={i + 1}>Page {i + 1}</option>)}</select><span className="folio-total">/ 604</span></label></div>
    </header>
    <div className="reader-frame"><div ref={scroll} className="reading-stream" onScroll={onScroll} tabIndex={0} aria-label="Quran pages. Scroll horizontally; Al-Fatiha is at the right end.">
      {pages.map(n => <section key={n} className="reading-page" aria-label={'Page ' + n}>{Math.abs(n - active) <= 2 && <PageContent page={n} onEntry={setEntryVerse} highlight={highlight} onSelect={key => { setSelected(key); setHighlight(key); }} onTap={() => setChromeOpen(value => !value)} />}</section>)}
    </div></div>
    {entryVerse && <Suspense fallback={<Spinner />}><AyahLinks verse={entryVerse} page={active} readerState={{chromeOpen,selected,highlight}} close={()=>setEntryVerse(null)}/></Suspense>}
    <button type="button" className="reader-controls-toggle" onClick={() => setChromeOpen(value => !value)}>{chromeOpen ? 'Hide reader controls' : 'Show reader controls'}</button>
    {selected && <aside className="ayah-action-bar" aria-label={'Actions for ayah ' + selected}><span className="ayah-action-key">{selected}</span><span className="sr-only">Actions coming soon</span><div className="ayah-action-buttons"><button type="button" title="Mutashabihat" aria-label="Mutashabihat" onClick={()=>setEntryVerse(selected)}><Link2 size={18}/></button>{[{ name: 'Translation', Icon: Languages }, { name: 'Tafsir', Icon: BookOpen }, { name: 'Bookmark', Icon: Bookmark }, { name: 'Comment', Icon: MessageSquare }].map(({ name, Icon }) => <button type="button" key={name} disabled title={name + ' — coming soon'}><Icon size={17} strokeWidth={1.6} /><span className="sr-only">{name} — coming soon</span></button>)}<button type="button" className="dismiss-ayah" onClick={clearSelection} aria-label="Clear selected ayah and close actions"><X size={18} strokeWidth={1.8} /></button></div></aside>}
  </div>;
}
export default function Mushaf() {
  const location = useLocation();
  const [params] = useSearchParams();
  const target = params.get('ayah');
  const surah = Number(params.get('surah'));
  const page = Number(params.get('page'));
  const initial = chapters.find(c => c.id === surah)?.page || (validPage(page) ? page : savedPage());
  const [chapter, verse] = (target || '').split(':').map(Number);
  const targetPage = target && /^\d+:\d+$/.test(target) ? ayahPages[chapter - 1]?.[verse - 1] : undefined;
  if (target && !validPage(targetPage || 0)) return <div className="reader-resolving"><Link to={location.state?.from === 'memobuddy' ? '/memobuddy' : '/'}>{location.state?.from === 'memobuddy' ? 'MemoBuddy' : 'Surahs'}</Link><div className="page-message" role="alert">Couldn’t open this ayah.</div></div>;
  const start = targetPage || (surah ? ayahPages[surah - 1]?.[0] : undefined) || initial;
  return <ReadingStream key={target || String(start)} initial={start} target={target} />;
}
