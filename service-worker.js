/* =========================================================
   Abel Conecta — service worker
   Estratégia:
   • instalação: pré-cache do app shell (caminhos relativos)
   • navegação: rede primeiro, cache como fallback offline
   • arquivos estáticos: cache primeiro, com atualização em segundo plano
   Ao publicar mudanças, aumente CACHE_VERSION para renovar o cache.
   ========================================================= */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `abel-conecta-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.webmanifest',
  './assets/logo-abel.png',
  './assets/logo-abel.svg',
  './assets/favicon.svg',
  './assets/icons/favicon-32.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png'
];

// Resolve os caminhos relativos a partir do escopo do service worker.
// Isso mantém o app funcional em um subdiretório do GitHub Pages.
const APP_SHELL_URLS = APP_SHELL.map((path) => new URL(path, self.registration.scope).href);
const OFFLINE_URL = new URL('./index.html', self.registration.scope).href;

const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Abel Conecta — offline</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px;
      background: #f3f6fa; color: #12263a; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; text-align: center; }
    .card { max-width: 420px; padding: 32px 24px; border: 1px solid #e1e8f1; border-radius: 24px; background: #fff;
      box-shadow: 0 18px 44px rgba(9, 30, 52, .1); }
    img { width: 92px; height: 92px; margin: 0 auto 16px; border-radius: 50%; }
    h1 { margin: 0 0 8px; font-size: 1.4rem; }
    p { margin: 0; color: #4b6076; font-size: .92rem; line-height: 1.6; }
  </style>
</head>
<body>
  <main class="card">
    <img src="./assets/logo-abel.png" alt="">
    <h1>Você está offline</h1>
    <p>Abra o aplicativo uma vez com internet para salvar os arquivos essenciais. Depois disso, ele funcionará offline.</p>
  </main>
</body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .catch((error) => {
        // Não impede a instalação caso um recurso opcional falhe.
        console.warn('Abel Conecta SW: pré-cache incompleto.', error);
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('abel-conecta-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  event.respondWith(handleStaticAsset(request));
});

async function handleNavigation(request) {
  try {
    const response = await fetch(request);

    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      // Mantém o shell offline atualizado com a versão mais recente.
      cache.put(OFFLINE_URL, response.clone()).catch(() => {});
    }

    return response;
  } catch (error) {
    const cached =
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match(OFFLINE_URL)) ||
      (await caches.match(new URL('./', self.registration.scope).href));

    if (cached) return cached;

    return new Response(OFFLINE_FALLBACK_HTML, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);

  const cached = await cache.match(request);
  if (cached) {
    // Atualiza em segundo plano sem atrasar a resposta.
    fetch(request)
      .then((response) => {
        if (response && response.ok && response.type === 'basic') {
          return cache.put(request, response.clone());
        }
        return undefined;
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => {});
    }

    return response;
  } catch (error) {
    const fallback = await caches.match(request, { ignoreSearch: true });
    if (fallback) return fallback;

    return new Response('Recurso indisponível offline.', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}
