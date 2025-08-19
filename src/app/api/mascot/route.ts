import { moderateOrThrow } from "@/lib/ai/moderation";
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { getPersonaByKey } from '@/lib/mascot/personas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

interface RequestBody {
  message: string
  conversationId?: string
  personaKey?: string
  userId?: string | null
  brand?: { name?: string }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

async function ensureConversation(
  conversationId: string | undefined,
  personaKey: string,
  userId: string | null
): Promise<string> {
  if (conversationId) return conversationId
  const { data, error } = await supabase
    .from('mascot_conversations')
    .insert({ user_id: userId, persona_key: personaKey })
    .select('id')
    .single()
  if (error || !data) throw new Error('Failed to create conversation')
  return data.id
}

async function loadHistory(conversationId: string, limit = 12): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('mascot_messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('id', { ascending: true })
    .limit(limit)
  if (error) throw new Error('Failed to load history')
  return (data || []) as ChatMessage[]
}

async function persistMessage(
  conversationId: string,
  role: ChatMessage['role'],
  content: string
) {
  const { error } = await supabase
    .from('mascot_messages')
    .insert({ conversation_id: conversationId, role, content })
  if (error) throw new Error('Failed to persist message')
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    if (!body?.message || typeof body.message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const personaKey = body.personaKey || 'default'
    const persona = getPersonaByKey(personaKey)
    const userId = body.userId ?? null

    const conversationId = await ensureConversation(body.conversationId, personaKey, userId)

    await moderateOrThrow(body.message)
    await persistMessage(conversationId, 'user', body.message)

    const history = await loadHistory(conversationId)

    const systemContent = [
      persona.systemPrompt,
      body.brand?.name ? `You are representing the brand: ${body.brand.name}.` : null,
      'Keep responses concise, friendly, and useful. Avoid emojis unless explicitly requested.'
    ]
      .filter(Boolean)
      .join('\n')

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...history,
      { role: 'user', content: body.message }
    ]

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: persona.temperature,
      max_tokens: 500
    })

    const reply = completion.choices?.[0]?.message?.content?.trim() || 'Okay.'

    await persistMessage(conversationId, 'assistant', reply)

    return NextResponse.json({ conversationId, reply })
  } catch (err: any) {
    console.error('Mascot API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
