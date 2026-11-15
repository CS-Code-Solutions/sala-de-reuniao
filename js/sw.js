// ==========================================
// SERVICE WORKER - MEETINGROOM (js/sw.js)
// ==========================================

const CACHE_NAME = 'meetingroom-firebase-v1.4.0';

const ASSETS_TO_CACHE = [
  '../index.html',
  '../manifest.json',
  '../termos.js',
  '../ico.png',
  '../cabe.png',
  '../login.png',
  '../fundo.jpg',
  '../css/global.css',
  '../css/components.css',
  '../pages/calendar.html',
  '../pages/my-reservations.html',
  '../pages/notifications.html',
  '../pages/privacy-policy.html',
  '../pages/rooms.html',
  '../pages/admin-users.html',
  '../pages/display-porta.html'
  '../js/anti-flicker.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas externas do Firebase, Firestore e Google APIs para manter tempo real
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('firebase') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {});
    })
  );
});
