import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

// Retired in the simplified single-owner V1.
// Max OS now uses one owner key directly on the api/chat functions.
// This function remains deployed only so stale clients receive a clear response.

Deno.serve(() => {
  return new Response(JSON.stringify({
    error: 'Legacy auth endpoint retired. Reload Max OS.',
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' },
  })
})
