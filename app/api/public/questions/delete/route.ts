import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { questionId } = await req.json()

  if (!questionId) return NextResponse.json({ error: 'Missing questionId' }, { status: 400 })

  const { data: question, error: fetchError } = await supabase
    .from('public_questions')
    .select('created_by')
    .eq('id', questionId)
    .maybeSingle()

  if (fetchError || !question) return NextResponse.json({ error: 'Question not found' }, { status: 404 })

  if (question.created_by !== user.id && !user.is_super_admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  await supabase.from('public_picks').delete().eq('question_id', questionId)
  await supabase.from('public_questions').delete().eq('id', questionId)

  return NextResponse.json({ success: true })
}
