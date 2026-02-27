import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { username, phone, code, newPassword, step } = await req.json()

  if (step === 'request') {
    const { data: user } = await supabase
      .from('users')
      .select('id, phone, phone_verified')
      .eq('username', username)
      .maybeSingle()

    if (!user || !user.phone_verified)
      return NextResponse.json({ error: 'No verified phone on this account' }, { status: 400 })

    const otp_code = Math.floor(100000 + Math.random() * 900000).toString()
    const code_hash = await bcrypt.hash(otp_code, 10)
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase.from('otps').insert({
      phone: user.phone,
      code_hash,
      purpose: 'password_reset',
      expires_at,
    })

    if (!process.env.TWILIO_ACCOUNT_SID) {
      return NextResponse.json({ success: true, bypass: true, code: otp_code, phone: user.phone })
    }

    const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    await twilio.messages.create({
      body: `Your Pick'em password reset code is: ${otp_code}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: user.phone,
    })

    return NextResponse.json({ success: true, phone: user.phone })
  }

  if (step === 'reset') {
    const { data: user } = await supabase
      .from('users')
      .select('id, phone')
      .eq('username', username)
      .maybeSingle()

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const { data: otp } = await supabase
      .from('otps')
      .select('*')
      .eq('phone', user.phone)
      .eq('purpose', 'password_reset')
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!otp) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })

    const valid = await bcrypt.compare(code, otp.code_hash)
    if (!valid) {
      await supabase.from('otps').update({ attempts: otp.attempts + 1 }).eq('id', otp.id)
      return NextResponse.json({ error: 'Incorrect code' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)
    await supabase.from('users').update({ password_hash: hashed }).eq('id', user.id)
    await supabase.from('otps').update({ used: true }).eq('id', otp.id)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
}
