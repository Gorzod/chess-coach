// Chess Coach service worker: keeps the app working offline.
// Bump VERSION when you upload a new index.html so phones pick up the update.
const VERSION = 'chess-coach-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('chess-coach') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
const put = (req, res) => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return res; };
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // The page itself: try the network first (to get updates), fall back to the saved copy offline.
    if (req.mode === 'navigate') {
      e.respondWith(fetch(req).then(r => put('./index.html', r)).catch(() => caches.match('./index.html')));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r))));
    return;
  }
  // Google Fonts: save them the first time so headings keep their font offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => put(req, r)).catch(() => hit)));
  }
});
