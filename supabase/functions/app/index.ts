import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const PHONE_URL = 'https://maxos-phone.tender-eft-3507.chatgpt.site'
const PHONE_ORIGIN = new URL(PHONE_URL).origin

const UPSTREAMS = {
  api: 'https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/api',
  chat: 'https://btqdrvvitjzwntudtyqr.supabase.co/functions/v1/chat',
} as const

type Target = keyof typeof UPSTREAMS

function corsHeaders(origin: string | null): Record<string, string> | null {
  if (origin !== PHONE_ORIGIN) return null
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'content-type, x-maxos-key',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const cors = corsHeaders(origin)

  if (req.method === 'OPTIONS') {
    if (!cors) return new Response(null, { status: 403 })
    return new Response(null, { status: 204, headers: cors })
  }

  if (req.method === 'POST') {
    if (!cors) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }

    const url = new URL(req.url)
    const target = url.searchParams.get('target')
    if (target !== 'api' && target !== 'chat') {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }

    const ownerKey = req.headers.get('x-maxos-key') || ''
    if (!ownerKey) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }

    try {
      const upstream = await fetch(UPSTREAMS[target as Target], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-maxos-key': ownerKey,
        },
        body: await req.text(),
        cache: 'no-store',
        redirect: 'error',
      })

      return new Response(await upstream.text(), {
        status: upstream.status,
        headers: {
          ...cors,
          'Content-Type': upstream.headers.get('content-type') || 'application/json',
          'Cache-Control': 'no-store',
          'Referrer-Policy': 'no-referrer',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    } catch (error) {
      console.error('MAXos relay upstream failure', error instanceof Error ? error.message : 'unknown error')
      return new Response(JSON.stringify({ error: 'MAXos upstream unavailable' }), {
        status: 502,
        headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      })
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      'Location': PHONE_URL,
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
    },
  })
})
