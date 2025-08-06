// src/root.tsx
import { Outlet } from 'react-router-dom'
import BackButton from './components/ui/BackButton'   // adjust path if needed

export default function RootLayout() {
  return (
    <div className="relative isolation-isolate min-h-screen">
      {/* Dot-grid background */}
      <div
        className="absolute inset-0 -z-10
                   bg-[radial-gradient(circle,#e5e7eb_1px,_transparent_1px)]
                   bg-[size:16px_16px]"
      />
      
      {/* ← Your shared Back button */}
      <BackButton />

      <main className="relative z-0 p-8">
        <Outlet />      {/* <-- All pages (Home, MemoBuddy, TriviaBuddy) render here */}
      </main>
    </div>
  )
}
