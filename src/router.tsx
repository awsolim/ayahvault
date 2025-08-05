import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './root';          // our layout file
import HomePage from './pages/HomePage';
import MemoBuddy from './apps/memobuddy/MemoBuddy';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,             // apply layout wrapper
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/memobuddy', element: <MemoBuddy /> },
    ],
  },
]);
