import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { createSession, verifyPassword } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  const { data: user } = await supabase
    .from('users')
    .select('id, username, password_hash, status')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (!user) return NextResponse.json({ error: 'Username not found.' }, { status: 404 })
  if (user.status === 'pending') return NextResponse.json({ error: 'Account pending approval.' }, { status: 403 })
  if (user.status === 'denied') return NextResponse.json({ error: 'Account denied.' }, { status: 403 })

  if (!user.password_hash) {
    return NextResponse.json({ needsPassword: true, user: user.id })
  }

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })

  await createSession(user.id)
  return NextResponse.json({ success: true })
}
