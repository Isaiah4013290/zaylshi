import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { phone, purpose } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('phone', phone)
    .neq('id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Phone already in use' }, { status: 400 })

  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const code_hash = await bcrypt.hash(code, 10)
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabase.from('otps').insert({
    phone,
    code_hash,
    purpose: purpose ?? 'phone_verify',
    expires_at,
  })

  if (!process.env.TWILIO_ACCOUNT_SID) {
    return NextResponse.json({ success: true, bypass: true, code })
  }

  const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  await twilio.messages.create({
    body: `Your Pick'em verification code is: ${code}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  })

  return NextResponse.json({ success: true })
}
