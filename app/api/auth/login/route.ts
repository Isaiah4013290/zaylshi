import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password)
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })

  const { data: user } = await supabase
    .from('users')
    .select('id, password_hash, status')
    .eq('username', username)
    .maybeSingle()

  if (!user)
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid)
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

  if (user.status !== 'approved')
    return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

  await createSession(user.id)
  return NextResponse.json({ success: true })
}
