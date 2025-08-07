// src/router.tsx

import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './root';                            // your shared layout
import HomePage from './pages/HomePage';
import MemoBuddy from './apps/memobuddy/MemoBuddy';
import GameSetup from './apps/triviabuddy/pages/GameSetup';
import TriviaBuddy from './apps/triviabuddy/TriviaBuddy';

export const router = createBrowserRouter([
  {
    path: '/',                // base URL
    element: <RootLayout />,  // layout wraps all child routes
    children: [
      // 1. Home page at "/"
      { index: true, element: <HomePage /> },

      // 2. MemoBuddy at "/memobuddy"
      { path: 'memobuddy', element: <MemoBuddy /> },

      // 3. Game setup at "/triviabuddy/setup"
      { path: 'triviabuddy/setup', element: <GameSetup /> },

      // 4. Play an existing game at "/triviabuddy/game/:gameId"
      { path: 'triviabuddy/game/:gameId', element: <TriviaBuddy /> },
    ],
  },
]);
