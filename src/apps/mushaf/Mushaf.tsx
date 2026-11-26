import Spinner from '../../components/ui/Spinner';
import { imagePoint, nearestAyah } from './selection';
import { ChevronDown } from 'lucide-react';
import { concealmentBounds, fitArtworkLines, fitMarkerBounds, type ArtworkOverlay, type PageData } from './artwork';
import MushafArtwork from './MushafArtwork';
import AyahActions from './AyahActions';
import PlaybackSettings from './PlaybackSettings';
import { defaultPlaybackOptions, readPlaybackPlan, savePlaybackPlan, useMushafPlayback, type PlaybackPlan } from './playback';
import { ayahIndex, ayahKeys, firstAyahPage, lastReadPage, pageCanContainAyah, rememberPage, validPage } from './readerPosition';
import { pageOffset, pageAtOffset } from './paging';
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import chapters from '../../assets/chapters.json';
import ayahPages from '../../assets/mushaf-pages.json';
import markerBounds from '../../assets/mushaf-marker-bounds.json';
import bannerBounds from '../../assets/mushaf-banner-bounds.json';
import Seo from '../../lib/Seo';
import { useLibrary } from '../../library/LibraryProvider';
const AyahLinks = lazy(() => import('../../library/AyahLinks'));
const TranslationDrawer = lazy(() => import('./TranslationDrawer'));
const MushafPractice = lazy(() => import('../memobuddy/MushafPractice'));
import type { PracticeBinding } from './practiceTypes';

const AYAH_HOLD_MS = 340;
const pages = Array.from({ length: 604 }, (_, i) => 604 - i);
const cache = new Map<number, PageData>();
const artworkPath = (page: number) => '/mushaf/dar-al-marefa/' + page;
async function getPage(page: number, signal: AbortSignal): Promise<PageData> {
  if (cache.has(page)) return cache.get(page)!;
  const response = await fetch(artworkPath(page) + '.json?layout=3', { signal });
  if (!response.ok) throw new Error('Page unavailable');
  const data: PageData = await response.json();
  if (!(data.width > 0 && data.height > 0 && data.regions?.length)) throw new Error('Invalid page data');
  cache.set(page, data);
  if (cache.size > 14) cache.delete(cache.keys().next().value!);
  return data;
}
function PageContent({ page, highlight, selected, picking, rangeStart, onSelect, onTap, onEntry, renderActions, practice }: {
  page: number;
  practice?: PracticeBinding;
  highlight: string | null;
  selected: string | null;
  picking: boolean;
  rangeStart: string | null;
  onSelect: (key: string) => void;
  onTap: () => void;
  onEntry: (key: string) => void;
  renderActions: (key: string, page: number, position: CSSProperties) => ReactNode;
}) {
  const { rows } = useLibrary();
  const linked = useMemo(() => new Set(rows.flatMap(row => row.entry.passages.map(p => p.verse))), [rows]);
  const [data, setData] = useState<PageData | null>(null);
  const [imageReady, setImageReady] = useState(false);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const hold = useRef<{ id: number; x: number; y: number; timer: number; moved: boolean; selected: boolean } | null>(null);
  const rangeTap = useRef(false);
  const artwork = useMemo(() => data && fitArtworkLines(data), [data]);
  const inPractice=!!practice?.active;
  const visible=(key:string)=>!inPractice||practice!.visible(key);
  const promptWords=inPractice?practice!.partialWords:null;
  const canInteract=(key:string)=>visible(key)&&!(inPractice&&key===practice!.anchor&&promptWords===0);
  const concealed=data&&inPractice?concealmentBounds(data,visible,practice!.anchor,promptWords):[];
  const interactiveRegions=artwork?.regions.flatMap(region=>{
    const [s,a,line]=region;const key=s+':'+a;
    if(!canInteract(key))return [];
    if(inPractice&&key===practice!.anchor&&promptWords!==null) return (data?.glyphs||[]).filter(([gs,ga,w,l])=>gs===s&&ga===a&&l===line&&w>0&&w<=promptWords).map(([gs,ga,,l,x1,y1,x2,y2])=>{const [left,top,right,bottom]=fitMarkerBounds([x1,y1,x2,y2],artwork.fits);return [gs,ga,l,left,top,right,bottom] as typeof region;});
    return [region];
  })||[];

  function cancelHold() {
    if (hold.current) window.clearTimeout(hold.current.timer);
    hold.current = null;
  }

  useEffect(() => cancelHold, []);
  useEffect(() => {
    const controller = new AbortController();
    getPage(page, controller.signal)
      .then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [page, retry]);

  function selectAt(x: number, y: number) {
    if (!surface.current || !data || !artwork || !imageReady) return;
    const point = imagePoint(x, y, surface.current.getBoundingClientRect(), data.width, data.height);
    if (picking && (point.x < 0 || point.x > data.width || point.y < 0 || point.y > data.height)) return;
    const boxes = artwork.regions.map(([surah, ayah, , left, top, right, bottom]) => ({ key: surah + ':' + ayah, left, right, top, bottom }));
    const key = nearestAyah(point.x, point.y, boxes);
    if (key && canInteract(key)) {
      if(inPractice && key===practice!.anchor && promptWords!==null) {
        const glyphs=(data.glyphs||[]).filter(([s,a])=>s+':'+a===key);
        const word=nearestAyah(point.x,point.y,glyphs.map(([, ,w,,x1,y1,x2,y2])=>{const [left,top,right,bottom]=fitMarkerBounds([x1,y1,x2,y2],artwork.fits);return {key:String(w),left,top,right,bottom};}));
        if(!word||Number(word)<1||Number(word)>promptWords)return;
      }
      onSelect(key);
    }
  }

  const lastRegion = selected && interactiveRegions.filter(([surah, ayah]) => surah + ':' + ayah === selected).at(-1);
  useLayoutEffect(() => {
    const element = surface.current;
    if (!element || !data || !imageReady || !lastRegion) return;
    const updatePosition = () => {
      const { clientWidth: width, clientHeight: height } = element;
      const scale = Math.min(width / data.width, height / data.height);
      const [, , , x1, y1, x2, y2] = lastRegion;
      const x = (width - data.width * scale) / 2 + (x1 + x2) / 2 * scale;
      const y = (height - data.height * scale) / 2;
      const below = y + y2 * scale + 5;
      const next = {
        left: Math.max(91, Math.min(width - 91, x)),
        top: below + 44 <= height ? below : Math.max(4, y + y1 * scale - 49),
      };
      setPosition(previous=>previous?.left===next.left&&previous?.top===next.top?previous:next);
    };
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(element);
    return () => observer.disconnect();
  }, [data, imageReady, lastRegion]);

  if (error) return <div className="page-message" role="alert"><p>Couldn’t load page {page}.</p><button onClick={() => { setError(false); setData(null); setImageReady(false); setRetry(n => n + 1); }}>Try again</button></div>;
  if (!data || !artwork) return <div className="page-message"><Spinner colorClassName="reader-spinner" /></div>;
  const { fits } = artwork;
  const regions = interactiveRegions;
  const markers: ArtworkOverlay[] = (data.endings ?? []).flatMap(([surah, ayah]) => {
    const key = surah + ':' + ayah;
    const hasEntry = linked.has(key);
    if(!visible(key)||(inPractice&&key===practice!.anchor&&promptWords!==null))return [];
    if (page > 2 && !hasEntry) return [];
    const bounds = markerBounds[ayahIndex(key)];
    return bounds ? [{ key, bounds: [bounds[0], bounds[1], bounds[2], bounds[3]], linked: hasEntry }] : [];
  });
  const banners: ArtworkOverlay[] = (bannerBounds[page - 1] ?? []).map(([left, top, right, bottom], i) => ({
    key: 'banner-' + i, bounds: [left, top, right, bottom], linked: false,
  }));
  const overlays = [...banners, ...markers];
  const source = artworkPath(page) + '.png';
  const customArtwork = fits.length > 0 || overlays.length > 0 || concealed.length > 0;
  return (
    <div className="mushaf-sheet"
      onPointerDown={event => {
        cancelHold();
        rangeTap.current = false;
        if (!event.isPrimary || event.button !== 0) return;
        const point = { id: event.pointerId, x: event.clientX, y: event.clientY, timer: 0, moved: false, selected: false };
        if (!picking) point.timer = window.setTimeout(() => {
          if (hold.current === point && !point.moved) {
            point.selected = true;
            selectAt(point.x, point.y);
          }
        }, AYAH_HOLD_MS);
        hold.current = point;
      }}
      onPointerMove={event => {
        const point = hold.current;
        if (point && point.id === event.pointerId && Math.hypot(event.clientX - point.x, event.clientY - point.y) > 10) {
          point.moved = true;
          window.clearTimeout(point.timer);
        }
      }}
      onPointerUp={event => {
        const point = hold.current;
        if (!point || point.id !== event.pointerId) return;
        if (!point.moved && !point.selected) {
          if (picking) rangeTap.current = true;
          else onTap();
        }
        cancelHold();
      }}
      onClick={event => {
        if (picking && rangeTap.current) {
          rangeTap.current = false;
          selectAt(event.clientX, event.clientY);
        }
      }}
      onPointerCancel={cancelHold}
      onPointerLeave={cancelHold}
      onContextMenu={event => {
        if (event.target instanceof Element && event.target.closest('.mushaf-artwork') && !event.target.closest('.ayah-action-anchor')) event.preventDefault();
      }}
    >
      <div ref={surface} className="mushaf-artwork">
        <img key={retry} className="mushaf-page-image" src={source} alt={'Quran, page ' + page} draggable={false} onLoad={() => setImageReady(true)} onError={() => setError(true)} style={{ opacity: imageReady && !customArtwork ? 1 : 0 }} />
        {imageReady && customArtwork && <MushafArtwork source={source} width={data.width} height={data.height} fits={fits} overlays={overlays} concealed={concealed} />}
        {imageReady ? (
          <svg className="mushaf-regions" viewBox={'0 0 ' + data.width + ' ' + data.height} aria-label={'Select an ayah on page ' + page}>
            {regions.map(([surah, ayah, line, x1, y1, x2, y2], index) => {
              const key = surah + ':' + ayah;
              const first = index === 0 || regions[index - 1][0] !== surah || regions[index - 1][1] !== ayah;
              const marked = key === highlight || key === rangeStart;
              return <rect key={key + ':' + line + ':' + index} x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={4} className={key === rangeStart ? 'range-start-region' : marked ? 'selected-region' : undefined} role={first ? 'button' : undefined} tabIndex={first ? 0 : undefined} aria-label={first ? 'Select ayah ' + key : undefined} aria-hidden={!first || undefined} aria-pressed={first ? marked : undefined} onKeyDown={event => { if (first && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.stopPropagation(); onSelect(key); } }} />;
            })}
            {!picking && markers.filter(marker => marker.linked).map(({ key, bounds }) => {
              const [left, top, right, bottom] = fitMarkerBounds(bounds, fits);
              return (
                <g
                  key={key}
                  className="mushaf-library-marker"
                  role="button"
                  tabIndex={0}
                  aria-label={'Open Mutashabihat for ' + key}
                  onPointerDown={event => event.stopPropagation()}
                  onPointerUp={event => event.stopPropagation()}
                  onClick={() => { if (highlight) onTap(); else onEntry(key); }}
                  onKeyDown={event => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    event.stopPropagation();
                    onEntry(key);
                  }}
                >
                  <rect x={left - 5} y={top - 5} width={right - left + 10} height={bottom - top + 10} rx={14} />
                </g>
              );
            })}
          </svg>
        ) : <div className="page-image-loading"><Spinner colorClassName="reader-spinner" /></div>}
        {!picking && selected && lastRegion && position && renderActions(selected, page, position)}
      </div>
    </div>
  );
}
function ReadingStream({ initial, target, initialSurah, practice }: { initial: number; target: string | null; initialSurah: number | null; practice?: PracticeBinding }) {
  const location = useLocation();
  const navigate = useNavigate();
  const reader = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const current = useRef(initial);
  const pendingScroll = useRef<number | null>(null);
  const [active, setActive] = useState(initial);
  const [chapterOverride, setChapterOverride] = useState<number | null>(initialSurah);
  const [highlight, setHighlight] = useState<string | null>(target || location.state?.readerHighlight || null);
  const [selected, setSelected] = useState<string | null>(location.state?.readerSelected || null);
  const [entryVerse, setEntryVerse] = useState<string | null>(null);
  const [bookVerse, setBookVerse] = useState<string | null>(null);
  const [draft, setDraft] = useState<PlaybackPlan | null>(null);
  const [pick, setPick] = useState<{ start: string | null; error?: boolean } | null>(null);
  const [savedPlan, setSavedPlan] = useState(readPlaybackPlan);
  const [chromeOpen, setChromeOpen] = useState(location.state?.readerChromeOpen !== false);
  const playback = useMushafPlayback(key => showAyah(key, true));
  const fromMemoBuddy = location.state?.from === 'memobuddy';
  const fromLibrary = location.state?.from === 'library' && location.state?.entryId;
  const backPath = fromMemoBuddy ? '/memobuddy' : fromLibrary ? '/library/' + location.state.entryId : '/';
  const backLabel = fromMemoBuddy ? 'MemoBuddy' : fromLibrary ? 'Entry' : 'Surahs';
  const entryNavigation = {
    returnTo: '/mushaf?page=' + active,
    returnState: {
      ...location.state,
      readerChromeOpen: chromeOpen,
      readerSelected: selected,
      readerHighlight: highlight,
    },
  };

  function clearSelection() {
    playback.stop();
    setSelected(null);
    setHighlight(null);
  }

  function tapReader() {
    if (pick) return;
    if (highlight) clearSelection();
    else setChromeOpen(value => !value);
  }

  function goToPage(page: number, surah: number | null = null) {
    clearSelection();
    movePage(page, surah);
  }

  function movePage(page: number, surah: number | null, animate = false) {
    const element = scroll.current;
    if (!validPage(page) || !element) return;
    const moved = current.current !== page;
    const slide = animate && Math.abs(current.current - page) === 1;
    current.current = page;
    setActive(page);
    setChapterOverride(surah);
    if (moved || !animate) {
      pendingScroll.current = slide ? page : null;
      element.scrollTo({ left: pageOffset(page, element.clientWidth), behavior: slide ? 'smooth' : 'instant' });
    }
    rememberPage(page);
    practice?.recordPage(page);
  }

  function showAyah(key: string, animate = false) {
    const first = firstAyahPage(key);
    if (!first) return;
    const page = current.current;
    const [surah, ayah] = key.split(':').map(Number);
    const onPage = first === page || cache.get(page)?.regions.some(([s, a]) => s === surah && a === ayah);
    movePage(onPage ? page : first, surah, animate);
    setSelected(key);
    setHighlight(key);
  }

  function practiceJump(key:string) {
    playback.stop();setBookVerse(null);setSelected(null);setHighlight(key);
    movePage(firstAyahPage(key) || active,Number(key.split(':')[0]),true);
  }
  useLayoutEffect(()=>{
    if(practice?.active){
      if(validPage(practice.resumePage??0))movePage(practice.resumePage!,null);
      else practiceJump(practice.anchor);
    }
    // Moving the page is tied to a new question, never to a reveal or settings edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[practice?.questionId]);
  function openBook(key: string) {
    playback.stop();
    setBookVerse(key);
    showAyah(key);
  }

  function browseTranslation(key: string) {
    setBookVerse(key);
    showAyah(key, true);
  }

  function planFor(key: string): PlaybackPlan {
    if (savedPlan?.from === key) return savedPlan;
    return { ...(savedPlan ?? defaultPlaybackOptions), from: key, to: key };
  }

  function openSettings(key: string) {
    playback.stop();
    setDraft(planFor(key));
  }

  function applySettings(plan: PlaybackPlan, play: boolean) {
    setSavedPlan(plan);
    savePlaybackPlan(plan);
    setDraft(null);
    if (play) playback.start(plan);
    else showAyah(plan.from);
  }

  function selectAyah(key: string) {
    if (!pick) {
      playback.stop();
      setSelected(key);
      setHighlight(key);
    } else if (!pick.start) {
      setPick({ start: key });
    } else if (ayahIndex(key) < ayahIndex(pick.start)) {
      setPick({ start: pick.start, error: true });
    } else if (draft) {
      setDraft({ ...draft, from: pick.start, to: key });
      setPick(null);
      showAyah(key);
    }
  }

  useLayoutEffect(() => {
    const element = scroll.current!;
    element.scrollLeft = pageOffset(current.current, element.clientWidth);
    const observer = new ResizeObserver(() => { element.scrollLeft = pageOffset(current.current, element.clientWidth); });
    observer.observe(element);
    return () => observer.disconnect();
  }, [initial]);

  useEffect(() => {
    const view = reader.current!;
    const element = scroll.current!;
    let edge: { id: number; x: number; y: number } | null = null;

    function beginEdge(event: TouchEvent) {
      edge = null;
      if (event.touches.length !== 1 || !event.cancelable) return;
      if (event.target instanceof Element && event.target.closest('a, button, select, .mushaf-library-marker, dialog')) return;
      const touch = event.touches[0];
      if (touch.clientX > 18) return;
      // On browsers that forward the edge touch, claim it before history navigation begins.
      event.preventDefault();
      edge = { id: touch.identifier, x: touch.clientX, y: touch.clientY };
    }

    function endEdge(event: TouchEvent) {
      if (!edge) return;
      const start = edge;
      edge = null;
      const touch = Array.from(event.changedTouches).find(({ identifier }) => identifier === start.id);
      if (!touch) return;
      const dx = touch.clientX - start.x;
      if (dx >= 35 && dx > Math.abs(touch.clientY - start.y)) {
        const page = current.current + 1;
        if (validPage(page)) element.scrollTo({ left: pageOffset(page, element.clientWidth), behavior: 'smooth' });
      }
    }

    function cancelEdge() { edge = null; }

    view.addEventListener('touchstart', beginEdge, { passive: false });
    view.addEventListener('touchend', endEdge);
    view.addEventListener('touchcancel', cancelEdge);
    return () => {
      view.removeEventListener('touchstart', beginEdge);
      view.removeEventListener('touchend', endEdge);
      view.removeEventListener('touchcancel', cancelEdge);
    };
  }, []);

  function onScroll() {
    const element = scroll.current!;
    const page = pageAtOffset(element.scrollLeft, element.clientWidth);
    if (pendingScroll.current !== null) {
      if (page === pendingScroll.current) pendingScroll.current = null;
      return;
    }
    if (page === current.current) return;
    current.current = page;
    setActive(page);
    setChapterOverride(null);
    clearSelection();
    rememberPage(page);
    practice?.recordPage(page);
  }

  useEffect(() => rememberPage(current.current), [initial]);

  const chapter = chapters.find(c => c.id === chapterOverride)
    || chapters.filter(c => ayahPages[c.id - 1][0] <= active).at(-1);
  const bookIndex = bookVerse ? ayahIndex(bookVerse) : -1;
  return (
    <div ref={reader} className={'reading-view' + (practice ? ' memo-reader' : '') + (chromeOpen ? '' : ' chrome-hidden') + (pick ? ' reader-picking' : '')}
      onPointerDownCapture={event => { event.currentTarget.dataset.keyboardFocus = 'false'; }}
      onKeyDownCapture={event => { if (event.key === 'Tab') event.currentTarget.dataset.keyboardFocus = 'true'; }}
      onClick={event => {
        if (event.target instanceof Element && !event.target.closest('.mushaf-sheet, .memo-practice-bar, .memo-practice-status, a, button, label, dialog')) tapReader();
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape' || event.defaultPrevented || (event.target instanceof Element && event.target.closest('dialog'))) return;
        if (pick) setPick(null);
        else if (highlight) clearSelection();
        else setChromeOpen(true);
      }}
    >
      <Seo title={chapter?.name || 'Mushaf'} />
      <div className="reader-chrome" aria-hidden={!chromeOpen} inert={!chromeOpen}>
        <header className="reader-toolbar">
          <Link to={backPath} className="reader-index-link" aria-label={'Back to ' + backLabel}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m14 5-7 7 7 7" stroke="currentColor" strokeWidth="1.6" /></svg>
            <span>{backLabel}</span>
          </Link>
          <label className="surah-selector">
            <span aria-hidden="true">{chapter?.name || 'Surah'}</span>
            <ChevronDown size={15} aria-hidden="true" />
            <select aria-label="Mushaf surah" value={chapter?.id || 1} onChange={event => {
              const id = Number(event.target.value);
              goToPage(ayahPages[id - 1][0], id);
            }}>
              {chapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="page-selector">
            <select aria-label="Mushaf page" value={active} onChange={event => goToPage(Number(event.target.value))}>
              {Array.from({ length: 604 }, (_, i) => <option key={i + 1} value={i + 1}>Page {i + 1}</option>)}
            </select>
            <span className="folio-total">/ 604</span>
          </label>
        </header>
      </div>
      {pick && <div className="play-range-instructions">
        <p role="status">{pick.error ? 'Choose an end ayah at or after ' + pick.start + '.' : pick.start ? 'Tap the end ayah. Start: ' + pick.start : 'Tap the start ayah.'}</p>
        <button type="button" className="library-text-button" onClick={() => setPick(null)}>Cancel</button>
      </div>}
      <div className="reader-frame">
        <div ref={scroll} className="reading-stream" onScroll={onScroll} onPointerDown={() => { pendingScroll.current = null; }} tabIndex={0} aria-label="Quran pages. Scroll horizontally; Al-Fatiha is at the right end.">
          {pages.map(n => (
            <section key={n} className="reading-page" aria-label={'Page ' + n} inert={n !== active}>
              {Math.abs(n - active) <= 2 && <PageContent
                page={n} practice={practice} onEntry={setEntryVerse} highlight={pick ? null : highlight}
                selected={n === active ? selected : null} picking={!!pick} rangeStart={pick?.start ?? null}
                onSelect={selectAyah} onTap={tapReader}
                renderActions={(key, page, position) => <AyahActions
                  key={key} verse={key} page={page} position={position}
                  playing={playback.playing && playback.verse === key}
                  audioError={playback.error && playback.verse === key}
                  toggleAudio={() => playback.toggle(planFor(key))}
                  openSettings={() => openSettings(key)} openBook={() => openBook(key)}
                  newEntry={() => navigate('/library/new?ayah=' + key, {
                    state: { ...entryNavigation, returnAfterSave: true },
                  })}
                />}
              />}
            </section>
          ))}
        </div>
      </div>
      <audio ref={playback.audio} preload="none" onPlaying={playback.markPlaying} onPause={playback.markPaused}
        onEnded={playback.advance} onError={playback.markError} />
      {draft && !pick && <PlaybackSettings draft={draft} change={setDraft} close={() => setDraft(null)}
        apply={applySettings} pick={() => { setChromeOpen(true); setPick({ start: null }); }} />}
      {bookVerse && <Suspense fallback={<Spinner fullscreen />}><TranslationDrawer verse={bookVerse}
        previous={ayahKeys[bookIndex - 1]} next={ayahKeys[bookIndex + 1]} go={browseTranslation}
        close={() => setBookVerse(null)} /></Suspense>}
      {practice?.renderControls(practiceJump)}
      <div className="reader-folio" aria-hidden="true">{active}</div>
      {entryVerse && <Suspense fallback={<Spinner fullscreen />}><AyahLinks verse={entryVerse} navigation={entryNavigation} close={() => setEntryVerse(null)} /></Suspense>}
      <button type="button" className="reader-controls-toggle" onClick={() => setChromeOpen(value => !value)}>{chromeOpen ? 'Hide reader controls' : 'Show reader controls'}</button>
    </div>
  );
}
export default function Mushaf() {
  const location = useLocation();
  const [params] = useSearchParams();
  const target = params.get('ayah');
  const surah = Number(params.get('surah'));
  const page = Number(params.get('page'));
  const initial = chapters.find(c => c.id === surah)?.page || (validPage(page) ? page : lastReadPage() ?? 1);
  const chapter = Number(target?.split(':')[0]);
  const targetPage = target ? (pageCanContainAyah(page, target) ? page : firstAyahPage(target)) : undefined;
  if (target && !validPage(targetPage || 0)) return <div className="reader-resolving"><Link to={location.state?.from === 'memobuddy' ? '/memobuddy' : '/'}>{location.state?.from === 'memobuddy' ? 'MemoBuddy' : 'Surahs'}</Link><div className="page-message" role="alert">Couldn’t open this ayah.</div></div>;
  const start = targetPage || (surah ? ayahPages[surah - 1]?.[0] : undefined) || initial;
  const initialSurah = target ? chapter : (chapters[surah - 1]?.id ?? null);
  if(location.state?.from==='memobuddy')return <Suspense fallback={<Spinner fullscreen/>}><MushafPractice key={location.key} target={target} entryKey={location.key}>{practice=><ReadingStream initial={start} target={target} initialSurah={initialSurah} practice={practice}/>}</MushafPractice></Suspense>;
  return <ReadingStream key={(target || surah) + ':' + start} initial={start} target={target} initialSurah={initialSurah} />;
}
