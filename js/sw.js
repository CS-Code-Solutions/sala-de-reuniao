// ==========================================
// SERVICE WORKER - MEETINGROOM (sw.js)
// ==========================================

const CACHE_NAME = 'meetingroom-cache-v1.0.0';

// Ficheiros essenciais a guardar em cache para carregamento rápido
const ASSETS_TO_CACHE = [
  './calendar.html',
  './admin-users.html',
  './privacy-policy.html',
  './js/termos.js',
  './ico.png',
  './cabe.png'
];

// Instalação do Service Worker e armazenamento dos assets em cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] A guardar ficheiros em cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] A remover cache antigo:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Interceção de pedidos de rede (estratégia: Cache primeiro, depois rede)
self.addEventListener('fetch', (event) => {
  // Ignora pedidos que não sejam GET ou ligações externas do Firebase/APIs
  if (event.request.method !== 'GET' || event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        // Se falhar e estiver offline, podes retornar uma página de fallback se desejado
      });
    })
  );
});
