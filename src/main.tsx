import { registerSW } from 'virtual:pwa-register'
import { watchForServiceWorkerUpdates } from './pwaUpdates'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The virtual registration installs the update/activation reload listener.
registerSW({
  immediate: true,
  onRegisteredSW(_url, registration) {
    if (registration) watchForServiceWorkerUpdates(registration);
  },
});
