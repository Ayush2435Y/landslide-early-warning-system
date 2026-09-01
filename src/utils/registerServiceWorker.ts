/**
 * Register Service Worker for offline capability
 */
export function registerServiceWorker(onSuccess?: () => void, onError?: (err: Error) => void) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] ServiceWorker registered with scope:', registration.scope);
          if (onSuccess) onSuccess();
        })
        .catch((error) => {
          console.warn('[SW] ServiceWorker registration failed:', error);
          if (onError) onError(error);
        });
    });
  }
}
