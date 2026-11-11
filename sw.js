/* mhgfysik.dk – service worker
 * Gør siden installerbar som app og lader besøgte sider virke offline.
 * Sider hentes altid friske fra nettet, når der er forbindelse;
 * uden forbindelse vises den gemte udgave.
 * Ret VERSION, hvis du vil tvinge alle til at hente forfra.
 */
const VERSION = 'mhgfysik-v2';
const CORE = [
  '/', '/index.html', '/index-en.html',
  '/boeger.html', '/boeger-en.html',
  '/testoversigt.html', '/offline.html',
  '/app/app.js', '/manifest.webmanifest',
  '/app/icon-192.png', '/app/icon-512.png'
];
// Store filer (video, lyd, dokumenter) gemmes ikke offline – det fylder for meget.
const SKIP = /\.(mp4|mov|webm|m4a|mp3|wav|pdf|docx?|pptx?|zip)$/i;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(c => Promise.allSettled(CORE.map(u => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (SKIP.test(url.pathname)) return;

  // Sider: net først, så gemt kopi, så offline-side
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
        return res;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then(r => r || caches.match('/offline.html'))
      )
    );
    return;
  }

  // Alt andet (billeder, scripts, spørgsmålsdatabaser, Three.js/MathJax fra CDN):
  // vis gemt kopi straks, og opdatér i baggrunden
  e.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
