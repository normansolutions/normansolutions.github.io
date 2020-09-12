importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const { registerRoute, NavigationRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkOnly } = workbox.strategies;
const { CacheableResponse } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;
const { setCacheNameDetails } = workbox.core;

const version = "ns35";

workbox.core.setCacheNameDetails({
  suffix: version
});

precacheAndRoute([
  { url: '/index.html', revision: version },
  { url: '/img/offline.png', revision: version }
]);

registerRoute(
  // Cache style resources, i.e. CSS files.
  ({ request }) => request.destination === 'style',
  // Use cache but update in the background.
  new CacheFirst({
    // Use a custom cache name.
    cacheName: 'css-cache-' + version,
  })
);

registerRoute(
  // Cache style resources, i.e. CSS files.
  ({ request }) => request.destination === 'script',
  // Use cache but update in the background.
  new CacheFirst({
    // Use a custom cache name.
    cacheName: 'js-cache-' + version,
  })
);


registerRoute(
  // Cache image files.
  ({ request }) => request.destination === 'image',
  // Use the cache if it's available.
  new CacheFirst({
    // Use a custom cache name.
    cacheName: 'image-cache-' + version,
  })
);

//clear invalid caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => keys.filter((key) => !key.endsWith(version)))
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
  );
});

//offline fallback
const CACHE_NAME = 'offline-html' + version;
// This assumes /offline.html is a URL for your self-contained
// (no external images or styles) offline page.
const FALLBACK_HTML_URL = '/offline.html';
// Populate the cache with the offline HTML page when the
// service worker is installed.
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(FALLBACK_HTML_URL))
  );
});


const networkOnly = new NetworkOnly();
const navigationHandler = async (params) => {
  try {
    // Attempt a network request.
    return await networkOnly.handle(params);
  } catch (error) {
    // If it fails, return the cached HTML.
    return caches.match(FALLBACK_HTML_URL, {
      cacheName: CACHE_NAME,
    });
  }
};

// Register this strategy to handle all navigations.
registerRoute(
  new NavigationRoute(navigationHandler)
);
