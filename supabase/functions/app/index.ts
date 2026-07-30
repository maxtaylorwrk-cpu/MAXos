import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const PHONE_URL = 'https://maxos-phone.tender-eft-3507.chatgpt.site'

Deno.serve(() => {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': PHONE_URL,
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff'
    }
  })
})
