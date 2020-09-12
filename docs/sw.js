importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate } = workbox.strategies;
const { CacheableResponse } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { precacheAndRoute } = workbox.precaching;
const { setCacheNameDetails } = workbox.core;

const version = "ns15";

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
    plugins: [
      new ExpirationPlugin({
        // Cache only 20 images.
        maxEntries: 20,
        // Cache for a maximum of a week.
        maxAgeSeconds: 7 * 24 * 60 * 60,
      })
    ],
  })
);

//clear invalid caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      let validCacheSet = new Set(Object.values(workbox.core.cacheNames));
      return Promise.all(
        cacheNames
          .filter(function (cacheName) {
            return !validCacheSet.has(version);
          })
          .map(function (cacheName) {
            console.log("deleting cache", cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
});