# MAXos phone frontend

Installable, phone-first owner interface for MAXos.

- The browser sends the owner key in `x-maxos-key`; it is never placed in a URL.
- The same-origin `/api/maxos/api` and `/api/maxos/chat` routes forward requests
  to the existing Supabase Edge Functions without logging or storing the key.
- Supabase remains the live database/runtime and Groq remains the inference
  provider.
- The service worker caches only public PWA metadata and icons. It never caches
  owner API or chat traffic and does not attempt offline data synchronization.

Supabase Edge Functions intentionally rewrite HTML responses to plain text, so
the static interface is hosted separately over HTTPS. The legacy Supabase
`app` function redirects to the deployed phone URL.
