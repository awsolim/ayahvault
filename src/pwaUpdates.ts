/** Recheck on app launch/resume; never disrupt reading for failed/offline checks. */
export function watchForServiceWorkerUpdates(registration: Pick<ServiceWorkerRegistration, 'update'>) {
  let lastCheck = -Infinity;
  let checking = false;
  const check = async () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine || checking || Date.now() - lastCheck < 60_000) return;
    checking = true;
    lastCheck = Date.now();
    try { await registration.update(); } catch { lastCheck = -Infinity; } finally { checking = false; }
  };
  const resume = () => { void check(); };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('pageshow', resume);
  window.addEventListener('focus', resume);
  window.addEventListener('online', resume);
  resume();
  return () => {
    document.removeEventListener('visibilitychange', resume);
    window.removeEventListener('pageshow', resume);
    window.removeEventListener('focus', resume);
    window.removeEventListener('online', resume);
  };
}
