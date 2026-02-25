import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { code } = await req.json()
  if (!code) return NextResponse.json({ error: 'Join code required' }, { status: 400 })

  const { data: league } = await supabase
    .from('leagues')
    .select('id, join_mode, starting_tokens')
    .eq('join_code', code.toUpperCase().trim())
    .maybeSingle()

  if (!league) return NextResponse.json({ error: 'Invalid join code.' }, { status: 404 })

  const { data: existing } = await supabase
    .from('league_members')
    .select('id, status')
    .eq('league_id', league.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'approved') return NextResponse.json({ error: 'You are already in this league.' }, { status: 400 })
    if (existing.status === 'pending') return NextResponse.json({ error: 'Your request is pending approval.' }, { status: 400 })
  }

  const status = league.join_mode === 'auto_join' ? 'approved' : 'pending'

  await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: user.id,
    role: 'member',
    status,
    tokens: status === 'approved' ? league.starting_tokens : 0,
  })

  return NextResponse.json({ success: true, status, leagueId: league.id })
}
