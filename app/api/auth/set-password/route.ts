import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { userId, password } = await req.json()

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password too short.' }, { status: 400 })
  }

  const hash = await hashPassword(password)

  const { error } = await supabase
    .from('users')
    .update({ password_hash: hash })
    .eq('id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await createSession(userId)
  return NextResponse.json({ success: true })
}
