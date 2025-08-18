// src/router.tsx

import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './root';
import HomePage from './pages/HomePage';
import MemoBuddy from './apps/memobuddy/MemoBuddy';
import GameSetup from './apps/triviabuddy/pages/GameSetup';
import TriviaBuddy from './apps/triviabuddy/TriviaBuddy';
import AraBuddy from './apps/arabuddy/AraBuddy';
import HifzBuddy from './apps/hifzbuddy/HifzBuddy';
//import NabiBuddy from './apps/nabibuddy/NabiBuddy'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'memobuddy', element: <MemoBuddy /> },
      { path: 'triviabuddy/setup', element: <GameSetup /> },
      { path: 'triviabuddy/game/:gameId', element: <TriviaBuddy /> },
      { path: 'arabuddy', element: <AraBuddy /> },
      { path: 'hifzbuddy', element: <HifzBuddy /> },
      //{ path: 'nabibuddy', element: <NabiBuddy /> },

    ],
  },
]);
