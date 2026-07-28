import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const OWNER_KEY = Deno.env.get('APP_PASSPHRASE') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || ''
const CONFIGURED = Boolean(OWNER_KEY && SUPABASE_URL && SERVICE_KEY && GROQ_API_KEY)
const supabase = CONFIGURED ? createClient(SUPABASE_URL, SERVICE_KEY) : null

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

function authorized(req: Request): boolean {
  const provided = req.headers.get('x-maxos-key') || ''
  return CONFIGURED && provided === OWNER_KEY
}

const LOLA_PERSONA = `You are Lola. You are not a search engine, not a task manager — you are a thinking partner, pattern recognizer, system builder, and mirror that reflects the user's best self back to him. Your job is to help him become the man he is trying to become. You do this by: noticing patterns he misses, protecting his long-term goals from short-term impulses, organizing scattered thoughts into clear frameworks, asking probing follow-up questions (one good question is worth ten answers), connecting ideas across business, faith, anime, relationships, and psychology as one system, challenging limiting beliefs respectfully — never blindly agreeing, celebrating real evidence of growth, and never optimizing away rest (Man Time — anime, gaming, family — is productive recovery, not wasted time). Your communication style is warm, playful, honest, curious, and never patronizing. You treat him as a capable equal. The standard: leave every conversation with him more organized, clear, and capable than when it started.`

async function callAI(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
    }),
  })

  if (!res.ok) {
    console.error('AI provider error status:', res.status)
    throw new Error('Lola is having trouble responding right now.')
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? '(no response)'
}

Deno.serve(async (req) => {
  if (!CONFIGURED || !supabase) return json({ error: 'Server configuration incomplete' }, 503)
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!authorized(req)) return json({ error: 'Unauthorized' }, 401)

  let body: { conversationId?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Bad request' }, 400)
  }

  const userMessage = String(body.message ?? '').trim()
  if (!userMessage) return json({ error: 'Empty message' }, 400)

  try {
    let conversationId = body.conversationId

    if (!conversationId) {
      const { data: convo, error } = await supabase
        .from('conversations')
        .insert({ title: userMessage.slice(0, 60) })
        .select()
        .single()
      if (error) throw error
      conversationId = convo.id
    } else {
      const { error } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
      if (error) throw error
    }

    const { error: userInsertError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role: 'user', content: userMessage })
    if (userInsertError) throw userInsertError

    const [{ data: knowledgeItems, error: knowledgeError }, { data: history, error: historyError }] = await Promise.all([
      supabase.from('knowledge_items').select('category,title,content'),
      supabase
        .from('messages')
        .select('role,content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(30),
    ])
    if (knowledgeError) throw knowledgeError
    if (historyError) throw historyError

    const knowledgeBlock = (knowledgeItems ?? [])
      .map((k) => `[${k.category}] ${k.title}\n${k.content}`)
      .join('\n\n---\n\n')

    const chronologicalHistory = (history ?? []).slice().reverse()
    const systemPrompt = `${LOLA_PERSONA}\n\nHere is what you permanently know about Max (his approved knowledge base):\n\n${knowledgeBlock}`

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...chronologicalHistory.map((m) => ({ role: m.role, content: m.content })),
    ]

    const reply = await callAI(aiMessages)

    const { error: assistantInsertError } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, role: 'assistant', content: reply })
    if (assistantInsertError) throw assistantInsertError

    return json({ conversationId, reply })
  } catch (err) {
    console.error(err)
    return json({ error: (err as Error).message ?? 'Server error' }, 500)
  }
})
