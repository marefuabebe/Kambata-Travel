self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // A simple pass-through fetch handler is enough to satisfy the PWA installability requirements
  // For production, you can implement standard caching strategies here.
});
