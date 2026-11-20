import Settings from './pages/Settings';
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './root';
import HomePage from './pages/HomePage';
import Unavailable from './pages/Unavailable';
import { apps, type AppId } from './config/apps';
import Spinner from './components/ui/Spinner';
const Mushaf = lazy(() => import('./apps/mushaf/Mushaf'));
const MemoBuddy = lazy(() => import('./apps/memobuddy/MemoBuddy'));
const GameSetup = lazy(() => import('./apps/triviabuddy/pages/GameSetup'));
const TriviaBuddy = lazy(() => import('./apps/triviabuddy/TriviaBuddy'));
const AraBuddy = lazy(() => import('./apps/arabuddy/AraBuddy'));
const HifzBuddy = lazy(() => import('./apps/hifzbuddy/HifzBuddy'));
function appRoute(id: AppId, element: ReactNode) {
  return apps.find(app => app.id === id)?.enabled
    ? <Suspense fallback={<Spinner />}>{element}</Suspense>
    : <Unavailable message="This app is currently unavailable." />;
}
export const router = createBrowserRouter([{
  path: '/', element: <RootLayout />, children: [
    { index: true, element: <HomePage /> },
    { path: 'settings', element: <Settings /> },
    { path: 'mushaf', element: <Suspense fallback={<Spinner />}><Mushaf /></Suspense> },
    { path: 'memobuddy', element: appRoute('memobuddy', <MemoBuddy />) },
    { path: 'triviabuddy/setup', element: appRoute('triviabuddy', <GameSetup />) },
    { path: 'triviabuddy/game/:gameId', element: appRoute('triviabuddy', <TriviaBuddy />) },
    { path: 'arabuddy', element: appRoute('arabuddy', <AraBuddy />) },
    { path: 'hifzbuddy', element: appRoute('hifzbuddy', <HifzBuddy />) },
    { path: '*', element: <Unavailable /> },
  ],
}]);
