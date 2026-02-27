import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { phone, code } = await req.json()
  if (!phone) return NextResponse.json({ error: 'Phone required' }, { status: 400 })

  if (!process.env.TWILIO_ACCOUNT_SID) {
    await supabase.from('users').update({
      phone,
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      public_coins: 100,
      last_coins_granted_at: new Date().toISOString(),
    }).eq('id', user.id)
    return NextResponse.json({ success: true, verified: true })
  }

  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 })

  const { data: otp } = await supabase
    .from('otps')
    .select('*')
    .eq('phone', phone)
    .eq('purpose', 'phone_verify')
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!otp) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

  if (otp.attempts >= 5) {
    await supabase.from('otps').update({ used: true }).eq('id', otp.id)
    return NextResponse.json({ error: 'Too many attempts' }, { status: 400 })
  }

  const valid = await bcrypt.compare(code, otp.code_hash)
  if (!valid) {
    await supabase.from('otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id)
    return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
  }

  await supabase.from('otps').update({ used: true }).eq('id', otp.id)
  await supabase.from('users').update({
    phone,
    phone_verified: true,
    phone_verified_at: new Date().toISOString(),
    public_coins: 100,
    last_coins_granted_at: new Date().toISOString(),
  }).eq('id', user.id)

  return NextResponse.json({ success: true, verified: true })
}
