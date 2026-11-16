// ==========================================
// SERVICE WORKER - MEETINGROOM (js/sw.js)
// ==========================================

const CACHE_NAME = 'meetingroom-cache-v2.0.0';

// Detecta automaticamente a raiz da aplicação (funciona tanto na Vercel "/" quanto em subpastas)
const APP_ROOT = self.location.pathname.includes('/js/')
  ? new URL('../', self.location.href).href
  : new URL('./', self.location.href).href;

const ROTA = (caminhoRelativo) => new URL(caminhoRelativo, APP_ROOT).href;

// Ficheiros essenciais da aplicação (caminhos reais do projeto)
const ASSETS_TO_CACHE = [
  ROTA('index.html'),
  ROTA('login.html'),
  ROTA('manifest.json'),
  ROTA('pages/calendar.html'),
  ROTA('pages/my-reservations.html'),
  ROTA('pages/notifications.html'),
  ROTA('pages/rooms.html'),
  ROTA('pages/admin-users.html'),
  ROTA('pages/display-porta.html'),
  ROTA('pages/privacy-policy.html'),
  ROTA('css/global.css'),
  ROTA('css/components.css'),
  ROTA('js/anti-flicker.js'),
  ROTA('js/firebase-config.js'),
  ROTA('js/auth.js'),
  ROTA('ico.png'),
  ROTA('cabe.png'),
  ROTA('login.png')
];

// Domínios externos que NUNCA devem ser interceptados pelo cache offline
const DOMINIOS_IGNORADOS = [
  'googleapis.com',
  'firebaseio.com',
  'firebaseapp.com',
  'gstatic.com',
  'emailjs.com',
  'whatsapp.com'
];

// Instalação: guarda os ficheiros individualmente para evitar que 1 falha aborte todo o PWA
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        ASSETS_TO_CACHE.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[Service Worker] Não foi possível pré-carregar:', url);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// Ativação: remove versões antigas do cache imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Estratégia de rede:
// - HTML / JS / CSS: Network-First (sempre tenta buscar a versão mais recente; usa cache se estiver offline)
// - Imagens / Ícones: Cache-First (carregamento instantâneo)
self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const urlObj = new URL(req.url);

  // Ignora extensões do navegador e chamadas de API do Firebase / EmailJS
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return;
  if (DOMINIOS_IGNORADOS.some((dominio) => urlObj.hostname.includes(dominio))) return;

  const isAssetEstatico = /\.(png|jpg|jpeg|svg|webp|ico|woff2?)$/i.test(urlObj.pathname);

  if (isAssetEstatico) {
    // Cache-First para imagens e ícones
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;

        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.ok && urlObj.origin === self.location.origin) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-First para páginas HTML, scripts JS e folhas de estilo CSS
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok && urlObj.origin === self.location.origin) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(req);
        if (cachedResponse) return cachedResponse;

        if (req.mode === 'navigate') {
          return caches.match(ROTA('index.html'));
        }
      })
  );
});
