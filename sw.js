/* RigCraft 3D — offline app shell; large optional GLBs remain network-only. */
const CACHE_NAME = 'rigcraft-shell-v2';
const CORE_FILES = [
  './', './index.html', './style.css', './selection-tools.css', './legal.css',
  './app.js', './parts.json', './favicon.svg',
  './js/performance.js', './js/workspace.js', './js/selection-tools.js',
  './js/component-inspector.js', './js/component-asset-manager.js',
  './js/model-registry.js', './js/supabase-catalogue.js',
  './vendor/three-r128.min.js', './vendor/GLTFLoader-r128.js',
  './vendor/meshopt_decoder.js', './vendor/SkeletonUtils-r128.js',
  './vendor/OrbitControls-r128.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(CORE_FILES.map((url) => cache.add(url)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith('rigcraft-shell-') && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  const url = new URL(request.url);
  const extension = url.pathname.toLowerCase().split('.').pop();
  if (extension === 'glb') return;

  // HTML, scripts, styles, and data must refresh after deployments. The cache
  // is a fallback for offline use, not a permanent source of stale app code.
  const networkFirst = request.mode === 'navigate' || ['html', 'js', 'css', 'json'].includes(extension);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    if (networkFirst) {
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch (_) {
        return (await cache.match(request)) || Response.error();
      }
    }

    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    } catch (_) {
      return Response.error();
    }
  })());
});
