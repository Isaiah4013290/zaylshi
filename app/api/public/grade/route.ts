import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { questionId, correct_answer } = await req.json()

  const { data: question } = await supabase
    .from('public_questions')
    .select('*')
    .eq('id', questionId)
    .maybeSingle()

  if (!question) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (question.created_by !== user.id && !user.is_super_admin)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  await supabase.from('public_questions')
    .update({ correct_answer, status: 'graded' }).eq('id', questionId)

  const { data: picks } = await supabase
    .from('public_picks').select('*').eq('question_id', questionId)

  if (picks && picks.length > 0) {
    const winners = picks.filter(p => p.pick === correct_answer)
    const losers = picks.filter(p => p.pick !== correct_answer)
    const loserPool = losers.reduce((sum, p) => sum + (p.wager || 0), 0)
    const winnerTotal = winners.reduce((sum, p) => sum + (p.wager || 0), 0)

    for (const pick of picks) {
      const correct = pick.pick === correct_answer
      let payout = 0
      if (correct && winnerTotal > 0) {
        payout = pick.wager + Math.floor((pick.wager / winnerTotal) * loserPool)
      }
      await supabase.from('public_picks')
        .update({ is_correct: correct, payout }).eq('id', pick.id)
      if (payout > 0) {
        await supabase.rpc('add_public_coins', { p_user_id: pick.user_id, p_amount: payout })
      }
    }
  }

  return NextResponse.json({ success: true })
}
