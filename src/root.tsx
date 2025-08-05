// src/root.tsx
import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="relative isolation-isolate min-h-screen">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 -z-10
                   bg-[radial-gradient(circle,#e5e7eb_1px,transparent_1px)]
                   bg-[size:16px_16px]"
      />
      {/* Main content */}
      <main className="relative z-0 p-8">
        <Outlet />
      </main>
    </div>
  );
}
