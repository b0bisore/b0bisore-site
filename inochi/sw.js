// 一度開けば、電波がなくても開けるようにする。ページ本体は「まず最新を取りに行き、だめなら保存分」。
const CACHE = 'inochi-v2';
// このファイルの場所(例:/inochi/)を基準にする
const SHELL = ['./', './style.css', './js/app.js', './js/core.js', './js/count.js', './manifest.webmanifest', './icon-192.png', './favicon.png'];

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.hostname === 'script.google.com') return;
  const fresh = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return res;
  });
  if (req.mode === 'navigate') {
    e.respondWith(fresh.catch(() => caches.match(req).then((r) => r || caches.match('./'))));
  } else {
    // 画像・書体・部品:保存分をすぐ使い、裏で新しくする
    e.respondWith(caches.match(req).then((cached) => cached || fresh));
    e.waitUntil(fresh.catch(() => {}));
  }
});
