self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("kayart-shell-v1").then((cache) => cache.addAll(["/offline.html", "/icon.svg"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith("kayart-shell-") && key !== "kayart-shell-v1")
          .map((key) => caches.delete(key))
      ))
    ])
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match("/offline.html"))
  );
});
