import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { name, tokenName, tokenSymbol, joinMode, startingTokens } = await req.json()

  if (!name?.trim()) return NextResponse.json({ error: 'League name required' }, { status: 400 })

  const { data: league, error } = await supabase
    .from('leagues')
    .insert({
      name: name.trim(),
      token_name: tokenName || 'Tokens',
      token_symbol: tokenSymbol || '🪙',
      join_mode: joinMode || 'admin_approval',
      starting_tokens: startingTokens || 100,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error || !league) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })

  await supabase.from('league_members').insert({
    league_id: league.id,
    user_id: user.id,
    role: 'owner',
    status: 'approved',
    tokens: startingTokens || 100,
  })

  return NextResponse.json({ success: true, leagueId: league.id })
}
