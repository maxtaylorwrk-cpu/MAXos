import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SESSION_SECRET = Deno.env.get('SESSION_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

async function verifySession(token: string | null): Promise<boolean> {
  if (!token) return false
  const [payload, sig] = token.split('.')
  if (!payload || !sig) return false
  if (Number(payload) < Date.now()) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const expectedBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  const expected = Array.from(new Uint8Array(expectedBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return expected === sig
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const token = req.headers.get('x-session')
  if (!(await verifySession(token))) return json({ error: 'Unauthorized' }, 401)

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }
  const action = body.action as string

  try {
    switch (action) {
      case 'home': {
        const [{ data: recentKnowledge }, { count: pendingCount }, { data: recentConvos }] =
          await Promise.all([
            supabase
              .from('knowledge_items')
              .select('id,title,category,updated_at')
              .order('updated_at', { ascending: false })
              .limit(3),
            supabase
              .from('knowledge_suggestions')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'pending'),
            supabase
              .from('conversations')
              .select('id,title,updated_at')
              .eq('archived', false)
              .order('updated_at', { ascending: false })
              .limit(1),
          ])
        return json({
          recentKnowledge: recentKnowledge ?? [],
          pendingCount: pendingCount ?? 0,
          lastConversation: recentConvos?.[0] ?? null,
        })
      }

      case 'knowledge.list': {
        const { data, error } = await supabase
          .from('knowledge_items')
          .select('id,category,title,content,updated_at')
          .order('category')
          .order('title')
        if (error) throw error
        return json({ items: data })
      }

      case 'journal.list': {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('id,content,created_at')
          .order('created_at', { ascending: false })
          .limit(100)
        if (error) throw error
        return json({ entries: data })
      }

      case 'journal.create': {
        const content = String(body.content ?? '').trim()
        if (!content) return json({ error: 'Empty entry' }, 400)
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({ content })
          .select()
          .single()
        if (error) throw error
        return json({ entry: data })
      }

      case 'suggestions.list': {
        const { data, error } = await supabase
          .from('knowledge_suggestions')
          .select('id,category,title,proposed_content,status,created_at,source_conversation_id')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
        if (error) throw error
        return json({ suggestions: data })
      }

      case 'suggestions.create': {
        const { category, title, content, source_conversation_id } = body as {
          category?: string
          title?: string
          content?: string
          source_conversation_id?: string
        }
        if (!category || !title || !content) return json({ error: 'Missing fields' }, 400)
        const { data, error } = await supabase
          .from('knowledge_suggestions')
          .insert({
            category,
            title,
            proposed_content: content,
            source_conversation_id: source_conversation_id ?? null,
          })
          .select()
          .single()
        if (error) throw error
        return json({ suggestion: data })
      }

      case 'suggestions.approve': {
        const id = body.id as string
        const { data: suggestion, error: fetchErr } = await supabase
          .from('knowledge_suggestions')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchErr || !suggestion) return json({ error: 'Not found' }, 404)

        const { error: insertErr } = await supabase.from('knowledge_items').insert({
          category: suggestion.category,
          title: suggestion.title,
          content: suggestion.proposed_content,
        })
        if (insertErr) throw insertErr

        const { error: updateErr } = await supabase
          .from('knowledge_suggestions')
          .update({ status: 'approved', resolved_at: new Date().toISOString() })
          .eq('id', id)
        if (updateErr) throw updateErr

        return json({ ok: true })
      }

      case 'suggestions.reject': {
        const id = body.id as string
        const { error } = await supabase
          .from('knowledge_suggestions')
          .update({ status: 'rejected', resolved_at: new Date().toISOString() })
          .eq('id', id)
        if (error) throw error
        return json({ ok: true })
      }

      case 'conversations.list': {
        const { data, error } = await supabase
          .from('conversations')
          .select('id,title,updated_at')
          .eq('archived', false)
          .order('updated_at', { ascending: false })
          .limit(50)
        if (error) throw error
        return json({ conversations: data })
      }

      case 'conversation.messages': {
        const id = body.id as string
        const { data, error } = await supabase
          .from('messages')
          .select('id,role,content,created_at')
          .eq('conversation_id', id)
          .order('created_at', { ascending: true })
        if (error) throw error
        return json({ messages: data })
      }

      case 'search': {
        const q = String(body.query ?? '').trim()
        if (!q) return json({ results: [] })
        const like = `%${q}%`

        const [knowledge, journal, msgs] = await Promise.all([
          supabase
            .from('knowledge_items')
            .select('id,title,content,category')
            .or(`title.ilike.${like},content.ilike.${like}`)
            .limit(10),
          supabase
            .from('journal_entries')
            .select('id,content,created_at')
            .ilike('content', like)
            .limit(10),
          supabase
            .from('messages')
            .select('id,content,conversation_id,created_at')
            .ilike('content', like)
            .limit(10),
        ])

        const results = [
          ...(knowledge.data ?? []).map((k) => ({
            source: 'Permanent Knowledge',
            title: k.title,
            snippet: k.content.slice(0, 140),
            refId: k.id,
            category: k.category,
          })),
          ...(journal.data ?? []).map((j) => ({
            source: 'Journal',
            title: new Date(j.created_at).toLocaleDateString(),
            snippet: j.content.slice(0, 140),
            refId: j.id,
          })),
          ...(msgs.data ?? []).map((m) => ({
            source: 'Conversation',
            title: 'Chat message',
            snippet: m.content.slice(0, 140),
            refId: m.conversation_id,
          })),
        ]
        return json({ results })
      }

      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message ?? 'Server error' }, 500)
  }
})
