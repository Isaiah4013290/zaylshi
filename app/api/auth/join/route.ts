import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { hashPassword, createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || username.length < 3) {
    return NextResponse.json({ error: 'Username must be at least 3 characters.' }, { status: 400 })
  }

  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Username already taken.' }, { status: 400 })

  const hash = await hashPassword(password)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      username: username.toLowerCase(),
      password_hash: hash,
      status: 'approved',
    })
    .select('id')
    .single()

  if (error || !user) return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })

  await createSession(user.id)
  return NextResponse.json({ success: true })
}
