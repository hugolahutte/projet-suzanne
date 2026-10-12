// Cache only a public offline document. Never cache authenticated HTML, API, or profiles.
const CACHE = 'suzanne-public-v1';
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(c => c.add('/offline.html'))); self.skipWaiting(); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('suzanne-public-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate' && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')));
  }
});
