import { NextRequest, NextResponse } from 'next/server'
import { hashPassword, createSession } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { username, password, phone } = await req.json()

  if (!username || !password)
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing)
    return NextResponse.json({ error: 'Username already taken' }, { status: 400 })

  if (phone) {
    const { data: phoneExists } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()
    if (phoneExists)
      return NextResponse.json({ error: 'Phone already in use' }, { status: 400 })
  }

  const password_hash = await hashPassword(password)

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      username,
      password_hash,
      status: 'approved',
      phone: phone || null,
      phone_verified: false,
    })
    .select('id')
    .single()

  if (error || !user)
    return NextResponse.json({ error: error?.message ?? 'Failed to create account' }, { status: 500 })

  await createSession(user.id)
  return NextResponse.json({ success: true })
}
