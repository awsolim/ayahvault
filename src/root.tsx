import { NavLink, Outlet, useLocation } from 'react-router-dom';
export default function RootLayout() {
  const { pathname } = useLocation();
  const reading = pathname === '/mushaf';
  return <div className={reading ? 'app-shell reading-shell' : 'app-shell'}>
    {!reading && <header className="app-header">
      <NavLink to="/" className="wordmark" aria-label="AyahVault home"><svg width="25" height="30" viewBox="0 0 25 30" fill="none" aria-hidden="true"><path d="M3 3h13l6 6v18H3V3Z" stroke="currentColor" strokeWidth="1.6"/><path d="M8 3v24M16 3v7h6M12 16h6M12 21h6" stroke="currentColor" strokeWidth="1.6"/></svg>AyahVault<span className="brand-period">.</span></NavLink>
      <nav className="primary-nav" aria-label="Main navigation"><NavLink to="/" end>Mushaf</NavLink><NavLink to="/memobuddy">Random ayah</NavLink></nav>
    </header>}
    <main className={reading ? 'reader-main' : 'app-main'}><Outlet /></main>
  </div>;
}
