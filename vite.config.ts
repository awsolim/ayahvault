import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({

      
      // --- Service Worker registration behavior ---
      registerType: 'autoUpdate', // NEW: SW auto-updates in background when you deploy

      // --- How to inject the registration code ---
      injectRegister: 'auto',     // NEW: injects small runtime to register SW (no manual code needed)

      // --- Workbox caching: what to precache in the app shell ---
      workbox: {
        // NEW: cache common asset types produced by Vite build
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // NEW: allow up to ~5MB
      },

      // We already provided a manual /site.webmanifest, so don't autogenerate one.
      manifest: false, // NEW: prevents plugin from generating a second manifest
    }),





  ],
});
