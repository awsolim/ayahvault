import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react-swc'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // main.tsx imports virtual:pwa-register, so no duplicate script is injected.
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,mp3}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        // Page artwork is cached on demand, never in the app-shell download.
        globIgnores: ['**/mushaf/**'],
        runtimeCaching: [{
          urlPattern: /\/mushaf\/dar-al-marefa\/\d+\.(png|json)$/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'dar-al-marefa-pages-v1',
            expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30, purgeOnQuotaError: true },
            cacheableResponse: { statuses: [200] },
          },
        }],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/api\//],
      },
      manifest: false,
    }),
  ],
})
