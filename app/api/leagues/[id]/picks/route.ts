import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: membership } = await supabase
    .from('league_members').select('tokens, status').eq('league_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || membership.status !== 'approved')
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const { questionId, pick, wager } = await req.json()

  const { data: question } = await supabase
    .from('league_questions').select('*').eq('id', questionId).maybeSingle()
  if (!question || question.status !== 'open')
    return NextResponse.json({ error: 'Question not open' }, { status: 400 })
  if (new Date(question.closes_at) <= new Date())
    return NextResponse.json({ error: 'Question is closed' }, { status: 400 })

  const { data: existing } = await supabase
    .from('league_picks').select('*').eq('question_id', questionId).eq('user_id', user.id).maybeSingle()

  const wagerNum = parseInt(wager) || 0
  const prevWager = existing?.wager || 0
  const wagerDiff = wagerNum - prevWager

  if (wagerDiff > 0 && membership.tokens < wagerDiff)
    return NextResponse.json({ error: 'Not enough tokens' }, { status: 400 })

  if (existing) {
    await supabase.from('league_picks').update({ pick, wager: wagerNum }).eq('id', existing.id)
  } else {
    await supabase.from('league_picks').insert({
      league_id: id, question_id: questionId, user_id: user.id, pick, wager: wagerNum
    })
  }

  if (wagerDiff !== 0) {
    await supabase.from('league_members')
      .update({ tokens: membership.tokens - wagerDiff })
      .eq('league_id', id).eq('user_id', user.id)
  }

  return NextResponse.json({ success: true })
}
