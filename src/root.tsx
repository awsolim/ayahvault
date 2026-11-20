import { PreferencesProvider } from './preferences/Preferences';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
export default function RootLayout() {
  const { pathname } = useLocation();
  const reading = pathname === '/mushaf';
  return <PreferencesProvider><div className={reading ? 'app-shell reading-shell' : 'app-shell'}>
    {!reading && <header className="app-header">
      <NavLink to="/" className="wordmark" aria-label="AyahVault home"><img src="/images/favicon-192.png" width="34" height="34" alt="" />AyahVault<span className="brand-period">.</span></NavLink>
      <nav className="primary-nav" aria-label="Main navigation"><NavLink to="/" end>Mushaf</NavLink><NavLink to="/memobuddy">MemoBuddy</NavLink><NavLink to="/settings">Settings</NavLink></nav>
    </header>}
    <main className={reading ? 'reader-main' : 'app-main'}><Outlet /></main>
  </div></PreferencesProvider>;
}
