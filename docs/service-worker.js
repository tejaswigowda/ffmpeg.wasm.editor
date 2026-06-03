/**
 * Service Worker for FFmpeg Video Editor PWA
 * 
 * This service worker provides:
 * - Offline-first caching strategy
 * - Network-first for HTML, JSON, JS (with fallback to cache)
 * - Cache-first for images, fonts, CSS, WASM libraries
 * - CDN resources caching (ffmpeg library, utilities, icons)
 */

const CACHE_NAME = 'ffmpeg-editor-v3';
const RUNTIME_CACHE = 'ffmpeg-editor-runtime-v3';
const CDN_CACHE = 'ffmpeg-editor-cdn-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/worker.js',
  '/coi-serviceworker.js',
  '/manifest.json',
];

const CDN_RESOURCES = [
  // FFmpeg library - core modules
  'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.js',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.wasm',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm/ffmpeg-core.worker.js',
  'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js',
  
  // Font Awesome icons
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/webfonts/fa-solid-900.ttf',
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Installation failed:', err);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== CDN_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event: implement caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle local app resources (network-first, fallback to cache)
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Only cache successful responses
          if (response && response.status === 200) {
            const cache = request.url.includes('.js') || 
                         request.url.includes('.json') ||
                         request.url.includes('.html')
              ? RUNTIME_CACHE
              : CACHE_NAME;
            
            const responseClone = response.clone();
            caches.open(cache).then((c) => {
              c.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Fetch failed, trying cache for:', request.url);
          return caches.match(request)
            .then((response) => {
              if (response) {
                console.log('[SW] Served from cache:', request.url);
                return response;
              }
              
              // For JS files, return empty module to prevent import errors offline
              if (request.url.includes('.js')) {
                return new Response('export default {};', {
                  status: 200,
                  headers: { 'Content-Type': 'application/javascript' },
                });
              }
              
              // Return offline page for navigation requests
              if (request.destination === 'document') {
                return caches.match('/index.html');
              }
              
              return new Response('Offline - resource not available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({ 'Content-Type': 'text/plain' }),
              });
            });
        })
    );
    return;
  }

  // Handle CDN resources (cache-first, fallback to network)
  if (url.origin.includes('cdn.jsdelivr.net') || 
      url.origin.includes('cdnjs.cloudflare.com')) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            console.log('[SW] Served from CDN cache:', request.url);
            return response;
          }
          
          return fetch(request)
            .then((response) => {
              // Only cache successful responses
              if (response && response.status === 200) {
                const responseClone = response.clone();
                caches.open(CDN_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                  console.log('[SW] Cached CDN resource:', request.url);
                });
              }
              return response;
            })
            .catch((err) => {
              console.error('[SW] Failed to fetch CDN resource:', request.url, err);
              // If offline and not cached, fail gracefully
              return new Response('', {
                status: 503,
                statusText: 'Service Unavailable',
              });
            });
        })
    );
    return;
  }

  // For other origins, try network first then cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(request)
          .then((response) => response || new Response('Offline', { status: 503 }));
      })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHES') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[SW] Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    });
  }
});
