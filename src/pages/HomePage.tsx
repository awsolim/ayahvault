import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import chapters from '../assets/chapters.json';
import Seo from '../lib/Seo';
export default function HomePage() {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const clean = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    const q = clean(search.trim());
    return chapters.filter(c => clean(String(c.id) + c.name + c.arabic).includes(q));
  }, [search]);
  let lastPage = 0;
  try { lastPage = Number(localStorage.getItem('ayahvault-last-page')); } catch { /* Optional reading history. */ }
  return <div className="surah-index">
    <Seo title="Mushaf" description="Read the Quran in the 15-line Madinah mushaf with AyahVault." />
    <div className="index-intro"><div><h1>The Quran<span lang="ar" dir="rtl">القرآن الكريم</span></h1></div>

    </div>
      {Number.isInteger(lastPage) && lastPage > 0 && lastPage <= 604 && <Link className="resume-reading" to={'/mushaf?page=' + lastPage}><span className="resume-label">Continue reading</span><span className="resume-surah">{[...chapters].reverse().find(c => c.page <= lastPage)?.name}</span><span className="resume-page">Page {lastPage}</span><svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m7 4 6 6-6 6" stroke="currentColor" strokeWidth="1.5"/></svg></Link>}
    <div className="index-tools"><h2>Surahs <span>114</span></h2><label className="surah-search"><svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/><path d="m13 13 4 4" stroke="currentColor" strokeWidth="1.5"/></svg><input type="search" placeholder="Find a surah" aria-label="Find a surah by name or number" value={search} onChange={e => setSearch(e.target.value)} /></label></div>
    <ol className="surah-list">{filtered.map(c => <li key={c.id}><Link to={'/mushaf?surah=' + c.id} className="surah-row"><span className="surah-number">{String(c.id).padStart(2, '0')}</span><span className="surah-name">{c.name}<span>{c.verses} ayahs</span></span><span className="surah-arabic" lang="ar" dir="rtl">{c.arabic}</span><span className="surah-page">{c.page}</span></Link></li>)}</ol>
    {!filtered.length && <p className="empty-search">No surahs found. Try a name or surah number.</p>}
    <footer className="index-footer"><span>AyahVault</span><span>15-line Madinah mushaf · Hafs</span></footer>
  </div>;
}
