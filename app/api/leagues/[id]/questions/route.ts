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

  const { question, option_a, option_b, pick_type, closes_at } = await req.json()

  const { error } = await supabase.from('league_questions').insert({
    league_id: id, question, option_a, option_b, pick_type, closes_at,
    created_by: user.id, status: 'open'
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: membership } = await supabase
    .from('league_members').select('role').eq('league_id', id).eq('user_id', user.id).maybeSingle()
  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { questionId, correct_answer } = await req.json()

  await supabase.from('league_questions')
    .update({ correct_answer, status: 'graded' }).eq('id', questionId)

  const { data: question } = await supabase.from('league_questions')
    .select('pick_type').eq('id', questionId).single()

  const { data: picks } = await supabase.from('league_picks')
    .select('*').eq('question_id', questionId)

  if (picks && picks.length > 0) {
    if (question?.pick_type === 'fixed') {
      for (const pick of picks) {
        const correct = pick.pick === correct_answer
        const payout = correct ? pick.wager * 2 : 0
        await supabase.from('league_picks').update({ is_correct: correct, payout }).eq('id', pick.id)
        if (correct && payout > 0) {
          await supabase.rpc('add_tokens', { p_league_id: id, p_user_id: pick.user_id, p_amount: payout })
        }
      }
    } else {
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
        await supabase.from('league_picks').update({ is_correct: correct, payout }).eq('id', pick.id)
        if (payout > 0) {
          await supabase.rpc('add_tokens', { p_league_id: id, p_user_id: pick.user_id, p_amount: payout })
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { questionId, question } = await req.json()
  await supabase.from('league_questions').update({ question }).eq('id', questionId)
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  if (!user.is_super_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { questionId } = await req.json()
  await supabase.from('league_questions').delete().eq('id', questionId)
  return NextResponse.json({ success: true })
}
