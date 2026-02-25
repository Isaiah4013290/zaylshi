import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { questionId, pick, wager } = await req.json()

  const { data: question } = await supabase
    .from('league_questions')
    .select('status, closes_at')
    .eq('id', questionId)
    .single()

  if (!question || question.status !== 'open' || new Date(question.closes_at) <= new Date()) {
    return NextResponse.json({ error: 'Question is closed' }, { status: 400 })
  }

  const { data: member } = await supabase
    .from('league_members')
    .select('tokens')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { data: existing } = await supabase
    .from('league_picks')
    .select('id, wager')
    .eq('question_id', questionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const wagerAmount = parseInt(String(wager)) || 0
  const availableTokens = member.tokens + (existing?.wager ?? 0)

  if (wagerAmount > availableTokens) {
    return NextResponse.json({ error: 'Not enough tokens' }, { status: 400 })
  }

  const newTokens = member.tokens + (existing?.wager ?? 0) - wagerAmount

  if (existing) {
    await supabase.from('league_picks').update({ pick, wager: wagerAmount }).eq('id', existing.id)
  } else {
    await supabase.from('league_picks').insert({ league_id: id, question_id: questionId, user_id: user.id, pick, wager: wagerAmount })
  }

  await supabase.from('league_members').update({ tokens: newTokens }).eq('league_id', id).eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
