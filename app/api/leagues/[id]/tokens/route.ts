import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: membership } = await supabase
    .from('league_members').select('role').eq('league_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { userId, amount } = await req.json()
  if (!userId || !amount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { error } = await supabase.rpc('add_tokens', {
    p_league_id: id,
    p_user_id: userId,
    p_amount: parseInt(amount)
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
