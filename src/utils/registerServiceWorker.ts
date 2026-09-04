/**
 * Register Service Worker for offline capability in production only
 * In development, unregisters any existing worker to prevent stale module caching
 */
export function registerServiceWorker(onSuccess?: () => void, onError?: (err: Error) => void) {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const isDev = Boolean((import.meta as any).env?.DEV);
    if (isDev) {
      // In development mode, unregister any active service worker and clear old caches
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      if ('caches' in window) {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key);
          }
        });
      }
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          if (onSuccess) onSuccess();
        })
        .catch((error) => {
          if (onError) onError(error);
        });
    });
  }
}

