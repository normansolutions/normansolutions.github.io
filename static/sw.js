importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const { registerRoute } = workbox.routing;
const { CacheFirst } = workbox.strategies;
const { CacheableResponse } = workbox.cacheableResponse;


registerRoute(
  // Cache style resources, i.e. CSS files.
  ({ request }) => request.destination === 'style',
  // Use cache but update in the background.
  workbox.strategies.staleWhileRevalidate({
    // Use a custom cache name.
    cacheName: 'css-cache',
  })
);

registerRoute(
  // Cache image files.
  ({ request }) => request.destination === 'image',
  // Use the cache if it's available.
  new CacheFirst({
    // Use a custom cache name.
    cacheName: 'image-cache',
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