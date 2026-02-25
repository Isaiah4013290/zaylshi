import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { getParlayMultiplier } from '@/lib/parlay'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { wager, legs } = await req.json()
  const wagerAmount = parseInt(String(wager))

  if (!wagerAmount || wagerAmount <= 0) return NextResponse.json({ error: 'Invalid wager' }, { status: 400 })
  if (!Array.isArray(legs) || legs.length < 2 || legs.length > 6) return NextResponse.json({ error: 'Need 2-6 legs' }, { status: 400 })

  const { data: member } = await supabase
    .from('league_members').select('tokens').eq('league_id', id).eq('user_id', user.id).single()

  if (!member || member.tokens < wagerAmount) return NextResponse.json({ error: 'Not enough tokens' }, { status: 400 })

  const multiplier = getParlayMultiplier(legs.length)

  const { data: parlay } = await supabase
    .from('league_parlays')
    .insert({ league_id: id, user_id: user.id, wager: wagerAmount, legs_count: legs.length, multiplier, status: 'pending' })
    .select('id').single()

  if (!parlay) return NextResponse.json({ error: 'Failed to create parlay' }, { status: 500 })

  await supabase.from('league_parlay_legs').insert(
    legs.map((l: any) => ({ parlay_id: parlay.id, question_id: l.questionId, pick: l.pick }))
  )

  await supabase.from('league_members').update({ tokens: member.tokens - wagerAmount }).eq('league_id', id).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
