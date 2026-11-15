const CACHE_NAME = 'sema-app-shell-v1';
const ARCHIVOS_CACHEABLES = ['script', 'style', 'image', 'font'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add('/index.html'))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves
        .filter((clave) => clave.startsWith('sema-app-shell-') && clave !== CACHE_NAME)
        .map((clave) => caches.delete(clave))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const solicitud = evento.request;
  const url = new URL(solicitud.url);
  if (solicitud.method !== 'GET' || url.origin !== self.location.origin) return;

  if (solicitud.mode === 'navigate') {
    evento.respondWith(
      fetch(solicitud)
        .then((respuesta) => {
          if (respuesta.ok) {
            const copia = respuesta.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copia));
          }
          return respuesta;
        })
        .catch(async () => (await caches.match('/index.html')) || Response.error()),
    );
    return;
  }

  if (!ARCHIVOS_CACHEABLES.includes(solicitud.destination)) return;
  evento.respondWith(
    fetch(solicitud)
      .then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(solicitud, copia));
        }
        return respuesta;
      })
      .catch(async () => (await caches.match(solicitud)) || Response.error()),
  );
});
