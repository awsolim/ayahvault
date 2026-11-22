import { parseAyahReference } from '../lib/ayahReference';
import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import chapters from '../assets/chapters.json';
import Seo from '../lib/Seo';
export default function HomePage() {
  const [search, setSearch] = useState('');
  const [reversed, setReversed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const reference = parseAyahReference(search, chapters.map(c => c.verses));
  const filtered = useMemo(() => {
    const clean = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    const q = clean(search.trim());
    const list = search.includes(':') ? (reference ? chapters.filter(c => c.id === Number(reference.split(':')[0])) : []) : chapters.filter(c => clean(String(c.id) + c.name + c.arabic).includes(q));
    return reversed ? [...list].reverse() : list;
  }, [search, reversed, reference]);
  let lastPage = 0;
  try { lastPage = Number(localStorage.getItem('ayahvault-last-page')); } catch { /* Optional reading history. */ }
  return <div className="surah-index">
    <Seo title="Mushaf" description="Read the Quran in the 15-line Madinah mushaf with AyahVault." />
    <div className="index-intro"><div><h1>The Quran<span lang="ar" dir="rtl">القرآن الكريم</span></h1></div>

    </div>
      {Number.isInteger(lastPage) && lastPage > 0 && lastPage <= 604 && <Link className="resume-reading" to={'/mushaf?page=' + lastPage}><span className="resume-label">Continue reading</span><span className="resume-surah">{[...chapters].reverse().find(c => c.page <= lastPage)?.name}</span><span className="resume-page">Page {lastPage}</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg></Link>}
    <div className="index-tools"><div className="surah-list-heading"><h2>Surahs</h2><button type="button" className="reverse-surahs" aria-label={reversed ? 'Show Al-Fatihah first' : 'Show An-Nas first'} aria-pressed={reversed} onClick={() => setReversed(value => !value)}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 19V5m-4 4 4-4 4 4M16 5v14m-4-4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div><div className="surah-search" role="search"><svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5"/></svg><input ref={input} type="search" placeholder="Search surah or ayah" aria-label="Find a surah or ayah reference" value={search} onChange={e => setSearch(e.target.value)} />{search && <button type="button" aria-label="Clear search" onClick={() => { setSearch(''); input.current?.focus(); }}>×</button>}</div></div>
    <ol className="surah-list">{filtered.map(c => <li key={c.id}><Link to={reference ? '/mushaf?ayah=' + reference : '/mushaf?surah=' + c.id} className="surah-row"><span className="surah-number">{String(c.id).padStart(2, '0')}</span><span className="surah-name">{c.name}<span>{reference ? 'Ayah ' + reference.split(':')[1] : c.verses + ' ayahs'}</span></span><span className="surah-arabic" lang="ar" dir="rtl">{c.arabic}</span><span className="surah-page">{c.page}</span></Link></li>)}</ol>
    {!filtered.length && <p className="empty-search">No results. Try a surah name, number, or a valid ayah such as 2:255.</p>}
    <footer className="index-footer"><span>AyahVault</span><span>15-line Madinah mushaf · Hafs</span></footer>
  </div>;
}
