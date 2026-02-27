import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('phone_verified, public_coins, lifetime_coins_wagered')
    .eq('id', user.id)
    .single()

  if (!userData?.phone_verified)
    return NextResponse.json({ error: 'Phone verification required' }, { status: 403 })

  const { questionId, pick, wager } = await req.json()
  const wagerNum = parseInt(wager) || 0

  const { data: question } = await supabase
    .from('public_questions')
    .select('*')
    .eq('id', questionId)
    .maybeSingle()

  if (!question || question.status !== 'open')
    return NextResponse.json({ error: 'Question not open' }, { status: 400 })
  if (new Date(question.closes_at) <= new Date())
    return NextResponse.json({ error: 'Question closed' }, { status: 400 })
  if (question.created_by === user.id)
    return NextResponse.json({ error: "Can't bet on your own question" }, { status: 400 })
  if (wagerNum > userData.public_coins)
    return NextResponse.json({ error: 'Not enough coins' }, { status: 400 })

  const { data: existing } = await supabase
    .from('public_picks')
    .select('id')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Already picked' }, { status: 400 })

  await supabase.from('public_picks').insert({
    question_id: questionId,
    user_id: user.id,
    pick,
    wager: wagerNum,
  })

  await supabase.from('users').update({
    public_coins: userData.public_coins - wagerNum,
    lifetime_coins_wagered: (userData.lifetime_coins_wagered ?? 0) + wagerNum,
  }).eq('id', user.id)

  await supabase.from('public_questions').update({
    unique_voters: question.unique_voters + 1,
    unique_voters_a: pick === 'a' ? question.unique_voters_a + 1 : question.unique_voters_a,
    unique_voters_b: pick === 'b' ? question.unique_voters_b + 1 : question.unique_voters_b,
    total_coins: question.total_coins + wagerNum,
  }).eq('id', questionId)

  return NextResponse.json({ success: true })
}
