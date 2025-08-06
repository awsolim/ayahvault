// src/components/ui/BackButton.tsx
import { useNavigate, useLocation } from 'react-router-dom';

export default function BackButton() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Don’t render on homepage
  if (pathname === '/') return null;

  return (
    <button
      onClick={() => navigate('/')}
      className="z-50 fixed top-4 left-4 bg-white border border-slate-300 rounded-full px-3 py-2 text-sm font-medium shadow hover:bg-emerald-50 transition"
    >
      ← Home
    </button>
  );
}
