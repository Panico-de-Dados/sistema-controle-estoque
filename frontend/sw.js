// Service worker simples: cacheia o "shell" da aplicação (HTML/CSS/JS)
// para permitir instalar o app na tela inicial. As chamadas à API
// (/api/...) NUNCA são cacheadas, pois os dados precisam estar sempre atualizados.

const CACHE_NAME = 'arquivo-morto-v12';
const ARQUIVOS_PARA_CACHE = [
  'index.html',
  'produtos.html',
  'familias-tipos.html',
  'scanner.html',
  'historico.html',
  'etiquetas.html',
  'js/tailwind-config.js',
  'js/api.js',
  'js/layout.js',
  'js/dashboard.js',
  'js/produtos.js',
  'js/familias.js',
  'js/scanner.js',
  'js/historico.js',
  'js/etiquetas.js',
  'vendor/qrcode.min.js',
  'vendor/html5-qrcode.min.js',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE_NAME).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // nunca cachear chamadas de API: sempre buscar dados frescos
  if (url.pathname.startsWith('/api/')) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((respostaRede) => {
        if (url.origin === self.location.origin && respostaRede.ok) {
          const copia = respostaRede.clone();
          return caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(event.request, copia))
            .then(() => respostaRede);
        }
        return respostaRede;
      })
      .catch(async () => {
        const respostaCache = await caches.match(event.request);
        if (respostaCache) return respostaCache;
        if (event.request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      })
  );
});
