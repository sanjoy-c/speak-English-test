/* ═══════════════════════════════════════════════
   বাংলা Explorer — Service Worker  (sw.js)
   Cache-first strategy for offline support
═══════════════════════════════════════════════ */
const CACHE_NAME = 'bangla-explorer-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/* Old Install: precache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});
*/

// Install: precache core assets 
self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open('app-v6').then(cache => {
      return cache.addAll([
        './',
        './index.html',
        './manifest.json'
      ]);
    })
  );
});


/* Old Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
*/

// Activate: clean old caches 
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== 'app-v6') return caches.delete(key);
        })
      )
    )
  );

  self.clients.claim();
});

// Fetch: network-first for API calls, cache-first for assets
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Always bypass cache for Google Apps Script calls
  if (url.includes('script.google.com') || url.includes('script.googleusercontent.com')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('./index.html'))
  );
});
