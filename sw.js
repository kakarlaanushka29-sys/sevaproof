/* sw.js (SevaProof) - lets the app open with no internet. Keep this file in the site root. */
const CACHE = 'sevaproof-v1';
const FILES = [
  './', 'index.html', 'dashboard.html', 'member.html', 'memberscan.html', 'scan.html',
  'verify.html', 'profile.html', 'challenges.html',
  'style.css', 'ui.js', 'login.js', 'supabase.js', 'qr.js', 'hash.js', 'certificate.js', 'profile.js',
  'checkin-guard.js', 'offline.js', 'challenges.js', 'manifest.json'
];

self.addEventListener('install', (e) => {
  // addAll fails if one file is missing, so add one by one and ignore misses
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => null)))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never cache Supabase / API calls

  // Network first (fresh files when online), cache fallback (works offline)
  e.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});