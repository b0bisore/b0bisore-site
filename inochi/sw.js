// 一度開けば、電波がなくても開けるようにする。
// ・このサイトの部品(ページ・JS・CSS・画像):毎回まず最新を取りに行き、電波がないときだけ保存分を使う(更新がすぐ届く)
// ・書体など外のサイトの部品:保存分を使う(変わらないため)
// ・記録の送信(script.google.com)には関わらない
const CACHE = 'inochi-v4';
const SHELL = ['./', './style.css', './js/app.js', './js/core.js', './js/count.js', './manifest.webmanifest', './icon-192.png', './favicon.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') return;
  const save = (res) => { if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); } return res; };
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(save).catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./') : undefined))));
  } else {
    e.respondWith(caches.match(req).then((cached) => cached || fetch(req).then(save)));
  }
});
