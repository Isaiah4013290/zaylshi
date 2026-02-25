import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: adminCheck } = await supabase
    .from('league_members').select('role').eq('league_id', id).eq('user_id', user.id).maybeSingle()

  if (!adminCheck || (adminCheck.role !== 'owner' && adminCheck.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, amount } = await req.json()
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })

  const { data: member } = await supabase
    .from('league_members').select('tokens').eq('league_id', id).eq('user_id', userId).single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  await supabase.from('league_members').update({ tokens: member.tokens + amount }).eq('league_id', id).eq('user_id', userId)

  return NextResponse.json({ success: true })
}
