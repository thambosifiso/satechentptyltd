const CACHE = "satech-app-v1";

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      cache.addAll([
        "/satechentptyltd/",
        "/satechentptyltd/index.html",
        "/satechentptyltd/manifest.webmanifest"
      ])
    )
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
