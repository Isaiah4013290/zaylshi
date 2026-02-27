import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: questions } = await supabase
    .from('public_questions')
    .select('*, users(username)')
    .eq('status', 'open')
    .gt('closes_at', new Date().toISOString())
    .order('unique_voters', { ascending: false })

  return NextResponse.json({ questions: questions ?? [] })
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: userData } = await supabase
    .from('users')
    .select('phone_verified, public_questions_created_today')
    .eq('id', user.id)
    .single()

  if (!userData?.phone_verified)
    return NextResponse.json({ error: 'Phone verification required' }, { status: 403 })

  if ((userData.public_questions_created_today ?? 0) >= 10)
    return NextResponse.json({ error: 'Max 10 questions per day' }, { status: 400 })

  const { question, option_a, option_b, closes_at } = await req.json()
  if (!question || !closes_at)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const { data, error } = await supabase.from('public_questions').insert({
    created_by: user.id,
    question,
    option_a: option_a || 'YES',
    option_b: option_b || 'NO',
    closes_at,
    status: 'open',
  }).select('id').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('users').update({
    public_questions_created_today: (userData.public_questions_created_today ?? 0) + 1
  }).eq('id', user.id)

  return NextResponse.json({ success: true, id: data.id })
}
