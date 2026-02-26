import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getParlayMultiplier } from '@/lib/parlay'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: membership } = await supabase
    .from('league_members').select('tokens, status').eq('league_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'approved')
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { wager, legs } = await req.json()

  if (!legs || legs.length < 2 || legs.length > 6)
    return NextResponse.json({ error: 'Parlay must have 2-6 legs' }, { status: 400 })
  if (!wager || wager <= 0)
    return NextResponse.json({ error: 'Invalid wager' }, { status: 400 })
  if (membership.tokens < wager)
    return NextResponse.json({ error: 'Not enough tokens' }, { status: 400 })

  const multiplier = getParlayMultiplier(legs.length)
  const payout = Math.min(500, Math.floor(wager * multiplier))

  const { data: parlay, error } = await supabase.from('league_parlays')
    .insert({ league_id: id, user_id: user.id, wager, legs_count: legs.length, multiplier, status: 'pending' })
    .select('id').single()

  if (error || !parlay) return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })

  for (const leg of legs) {
    await supabase.from('league_parlay_legs').insert({
      parlay_id: parlay.id, question_id: leg.questionId, pick: leg.pick
    })
  }

  await supabase.from('league_members')
    .update({ tokens: membership.tokens - wager })
    .eq('league_id', id).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
