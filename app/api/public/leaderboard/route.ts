import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data: users } = await supabase
    .from('users')
    .select('username, lifetime_coins_earned, lifetime_coins_wagered')
    .order('lifetime_coins_wagered', { ascending: false })
    .limit(50)

  return NextResponse.json({ users: users ?? [] })
}
