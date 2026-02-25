import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

async function isAdmin(userId: string, leagueId: string) {
  const { data } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', leagueId)
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role === 'owner' || data?.role === 'admin'
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user || !await isAdmin(user.id, id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { question, option_a, option_b, pick_type, closes_at } = await req.json()

  const { error } = await supabase.from('league_questions').insert({
    league_id: id,
    question,
    option_a: option_a || 'YES',
    option_b: option_b || 'NO',
    pick_type: pick_type || 'fixed',
    closes_at,
    created_by: user.id,
    status: 'open',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user || !await isAdmin(user.id, id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId, question } = await req.json()
  const { error } = await supabase.from('league_questions').update({ question }).eq('id', questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user || !await isAdmin(user.id, id)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { questionId, correct_answer } = await req.json()

  await supabase.from('league_questions').update({ correct_answer, status: 'graded' }).eq('id', questionId)

  const { data: picks } = await supabase.from('league_picks').select('*').eq('question_id', questionId)
  const { data: question } = await supabase.from('league_questions').select('pick_type').eq('id', questionId).single()

  if (picks && question) {
    for (const pick of picks) {
      const isCorrect = pick.pick === correct_answer
      const payout = isCorrect ? pick.wager * 2 : -pick.wager

      await supabase.from('league_picks').update({ is_correct: isCorrect, payout }).eq('id', pick.id)

      if (pick.wager > 0) {
        const { data: member } = await supabase
          .from('league_members')
          .select('tokens')
          .eq('league_id', id)
          .eq('user_id', pick.user_id)
          .single()

        if (member) {
          const newTokens = isCorrect ? member.tokens + pick.wager : member.tokens
          await supabase.from('league_members').update({ tokens: newTokens })
            .eq('league_id', id).eq('user_id', pick.user_id)
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user?.is_super_admin) return NextResponse.json({ error: 'Super admin only' }, { status: 403 })

  const { questionId } = await req.json()
  const { error } = await supabase.from('league_questions').delete().eq('id', questionId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
