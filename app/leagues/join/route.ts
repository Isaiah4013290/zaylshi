import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { code } = await req.json()

  const { data: league } = await supabase
    .from('leagues')
    .select('id, join_mode, starting_tokens')
    .eq('join_code', code.toUpperCase())
    .maybeSingle()

  if (!league) return NextResponse.json({ error: 'Invalid join code' }, { status: 404 })

  const { data: existing } = await supabase
    .from('league_members')
    .select('id, status')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'approved') return NextResponse.json({ error: 'Already a member' }, { status: 400 })
    return NextResponse.json({ pending: true, leagueId: league.id })
  }

  const status = league.join_mode === 'auto_join' ? 'approved' : 'pending'

  await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: user.id,
    role: 'member',
    status,
    tokens: status === 'approved' ? league.starting_tokens : 0,
  })

  return NextResponse.json({ success: true, leagueId: league.id, pending: status === 'pending' })
}
