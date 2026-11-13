const CACHE_NAME = '112191-work-v1.0.0';
const PRECACHE = ['./', './index.html', './styles.css', './app.js', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/config.js')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(res => { const clone = res.clone(); caches.open(CACHE_NAME).then(c => c.put('./index.html', clone)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    const found = clients.find(client => client.url.startsWith(self.location.origin));
    return found ? found.focus() : self.clients.openWindow('/');
  }));
});
self.addEventListener('push', event => {
  let payload = { title: '112191 WORK', body: 'Bạn có thông báo công việc mới.' };
  try { if (event.data) payload = { ...payload, ...event.data.json() }; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title, {body: payload.body, icon: '/icon-192.png', badge: '/icon-192.png', tag: payload.tag || 'work-update'}));
});
