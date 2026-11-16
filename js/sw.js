// ==========================================
// SERVICE WORKER - MEETINGROOM (sw.js)
// ==========================================

const CACHE_NAME = "meetingroom-cache-v1.1.0";

const ASSETS_TO_CACHE = [
  "../index.html",
  "../manifest.json",
  "../termos.js",
  "../ico.png",
  "../cabe.png",
  "../login.png",
  "./firebase-config.js",
  "./anti-flicker.js",
  "./auth.js",
  "../pages/calendar.html",
  "../pages/my-reservations.html",
  "../pages/notifications.html",
  "../pages/rooms.html",
  "../pages/admin-users.html",
  "../pages/privacy-policy.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn("[Service Worker] Falha parcial ao pré-carregar cache:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
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

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  if (
    event.request.method !== "GET" ||
    url.includes("firestore.googleapis.com") ||
    url.includes("identitytoolkit.googleapis.com") ||
    url.includes("securetoken.googleapis.com") ||
    url.includes("firebaseio.com")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
