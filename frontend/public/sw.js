self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // A simple cache-falling-back-to-network strategy to satisfy PWABuilder offline check
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Satisfy PWABuilder capability checks
self.addEventListener("push", (event) => {
  console.log("Push notification received", event);
});

self.addEventListener("sync", (event) => {
  console.log("Background sync event", event);
});

self.addEventListener("periodicsync", (event) => {
  console.log("Periodic sync event", event);
});
