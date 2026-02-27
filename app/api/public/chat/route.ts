import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: messages } = await supabase
    .from('public_messages')
    .select('*, users(username)')
    .order('created_at', { ascending: false })
    .limit(50)

  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { message } = await req.json()
  if (!message?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  if (message.length > 200) return NextResponse.json({ error: 'Message too long' }, { status: 400 })

  const { error } = await supabase.from('public_messages').insert({
    user_id: user.id,
    message: message.trim(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
