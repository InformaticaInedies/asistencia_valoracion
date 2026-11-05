/* Service worker: guarda la "cáscara" de la app para que abra sin conexión.
 * Los datos NO pasan por aquí: viven en el almacenamiento local de la app y se
 * sincronizan con la hoja de cálculo mediante la API de Apps Script.
 * Para publicar una versión nueva, cambie CACHE (por ejemplo, sa27-v2). */
const CACHE = 'sa27-v2';
const ARCHIVOS = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png',
  'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // la API de Google no se toca
  // Primero la copia guardada (rápido y sin conexión); en segundo plano se actualiza para la próxima vez.
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(req, { ignoreSearch: true }).then(function (hit) {
      const red = fetch(req).then(function (r) {
        if (r && r.ok) c.put(req, r.clone());
        return r;
      }).catch(function () { return hit || (req.mode === 'navigate' ? c.match('index.html') : undefined); });
      return hit || red;
    });
  }));
});
