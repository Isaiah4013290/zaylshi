import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: membership } = await supabase
    .from('league_members').select('status').eq('league_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'approved')
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const { data: message, error } = await supabase.from('league_messages')
    .insert({ league_id: id, user_id: user.id, text: text.trim() })
    .select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, message })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: membership } = await supabase
    .from('league_members').select('role').eq('league_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { messageId } = await req.json()
  await supabase.from('league_messages').update({ deleted: true }).eq('id', messageId)
  return NextResponse.json({ success: true })
}
