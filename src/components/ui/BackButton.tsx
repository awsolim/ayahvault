// src/components/ui/BackButton.tsx
import { useNavigate, useLocation } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Don’t render on homepage
  if (pathname === '/') return null;

  // Map each route prefix to a Tailwind hover color
  const themeHoverMap: Record<string, string> = {
    '/memobuddy': 'hover:bg-emerald-50',
    '/triviabuddy': 'hover:bg-blue-50',
    '/arabuddy': 'hover:bg-purple-50',
  };

  // Find the matching theme hover class based on the route
  const themeHoverClass =
    Object.entries(themeHoverMap).find(([route]) => pathname.startsWith(route))?.[1] ||
    'hover:bg-slate-50'; // fallback

  return (
    <button
      onClick={() => navigate('/')}
      className={[
        'z-50 fixed top-4 left-4 bg-white border border-slate-300 rounded-full px-3 py-2 text-sm font-medium shadow transition',
        themeHoverClass, // theme-specific hover background
      ].join(' ')}
    >
      ← Home
    </button>
  );
}
