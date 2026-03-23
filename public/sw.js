// No-op service worker — required for Chrome's PWA install prompt.
// Intentionally does not cache anything (offline support is out of scope).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
