import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const SESSION_SECRET = Deno.env.get('SESSION_SECRET')!
const APP_PASSPHRASE = Deno.env.get('APP_PASSPHRASE')!
const SESSION_DAYS = 30

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: { passphrase?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  if (body.passphrase !== APP_PASSPHRASE) {
    return json({ error: 'Incorrect passphrase' }, 401)
  }

  const expiry = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000
  const payload = String(expiry)
  const sig = await sign(payload)
  return json({ token: `${payload}.${sig}` })
})
