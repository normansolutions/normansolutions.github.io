importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const version = "ns28042020V4";
const precacheCacheName = workbox.core.cacheNames.precache;
const runtimeCacheName = workbox.core.cacheNames.runtime;

workbox.clientsClaim();

//clear invalid caches
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(keys => keys.filter(key => !key.endsWith(version)))
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
  );
});

workbox.core.setCacheNameDetails({
  prefix: "ns-ooo",
  suffix: version,
  precache: "precache",
  runtime: "runtime"
});

self.__precacheManifest = [
  {
    url: "/FrontEnd/build/img/main/offline.png",
    revision: "336689360776536478"
  },
  {
    url: "/Methods/offline",
    revision: "336689360776536478"
  },
  {
    url: "/manifest.webmanifest",
    revision: "336689360776536478"
  }
].concat(self.__precacheManifest || []);
workbox.precaching.suppressWarnings();
workbox.precaching.precacheAndRoute(self.__precacheManifest, {});

//cache fonts
workbox.routing.registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "ns-google-fonts-stylesheets-" + version
  })
);

workbox.routing.registerRoute(
  /.*(?:googleapis)\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "ns-googleapis-" + version
  })
);

workbox.routing.registerRoute(
  /.*(?:gstatic)\.com/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "ns-gstatic-" + version
  })
);

workbox.routing.registerRoute(
  /\.(?:css)$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "ns-static-css" + version
  })
);

workbox.routing.registerRoute(
  /\.(?:js)$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: "ns-static-js" + version
  })
);

//cache all images with limits
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  workbox.strategies.cacheFirst({
    cacheName: "ns-images-" + version,
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 250,
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 Days
        purgeOnQuotaError: true
      })
    ]
  })
);

//cache gallery with refresh
workbox.routing.registerRoute(
  /.*/,
  workbox.strategies.cacheFirst({
    cacheName: "ns-main-" + version,
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 90 * 24 * 60 * 60, // 90 Days
        purgeOnQuotaError: true
      })
    ]
  })
);

//offline fallback
const FALLBACK_URL = "/Methods/offline";
const urlHandler = workbox.strategies.cacheFirst();
workbox.routing.registerRoute(new RegExp("/.*"), ({ event }) => {
  return urlHandler.handle({ event }).catch(() => caches.match(FALLBACK_URL));
});
