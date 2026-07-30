const STATIC_CACHE = "maxos-static-v1";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];
const OFFLINE_HTML =
  '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#5B7FA6"><title>MAXos offline</title><body style="margin:0;background:#F7F7F5;color:#2B2E33;font:16px -apple-system,BlinkMacSystemFont,Segoe UI,sans-serif"><main style="max-width:32rem;margin:auto;padding:15vh 24px"><h1>MAXos is offline</h1><p>Reconnect to the internet, then reopen MAXos. Chat and saved data remain on the live Supabase backend.</p></main></body></html>';

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("maxos-static-") && key !== STATIC_CACHE,
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(
        () =>
          new Response(OFFLINE_HTML, {
            status: 503,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          }),
      ),
    );
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request)),
    );
  }
});
