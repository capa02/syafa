const CACHE_NAME = 'syafa';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json',
  'icon-192x192.png',
  'icon-512x512.png'
];

// Event: install (Service Worker diinstal)
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching all app shell content');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[Service Worker] Caching failed during install:', error);
      })
  );
});

// Event: fetch (Setiap kali browser mencoba mengambil resource)
self.addEventListener('fetch', event => {
  // Hanya tangani permintaan HTTP/HTTPS, abaikan permintaan chrome-extension:// dll.
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Jika resource ada di cache, kembalikan dari cache
          if (response) {
            console.log(`[Service Worker] Serving from cache: ${event.request.url}`);
            return response;
          }
          // Jika tidak ada di cache, coba ambil dari jaringan
          console.log(`[Service Worker] Serving from network: ${event.request.url}`);
          return fetch(event.request)
            .then(networkResponse => {
              // Jika fetch berhasil, tambahkan ke cache untuk penggunaan di masa mendatang
              if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
              return networkResponse;
            })
            .catch(error => {
              console.error(`[Service Worker] Fetch failed for: ${event.request.url}`, error);
              if (event.request.mode === 'navigate') {
                  // Anda bisa mengembalikan halaman offline khusus di sini jika ada
                  // return caches.match('/offline.html');
              }
            });
        })
    );
  }
});

// Event: activate (Service Worker diaktifkan, biasanya setelah instalasi atau update)
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated and cleaned up old caches.');
      return self.clients.claim();
    })
  );
});