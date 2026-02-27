import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const midnight = new Date()
  midnight.setHours(0, 0, 0, 0)

  const { data: users } = await supabase
    .from('users')
    .select('id, last_coins_granted_at')
    .eq('phone_verified', true)

  let count = 0
  for (const user of users ?? []) {
    const last = user.last_coins_granted_at ? new Date(user.last_coins_granted_at) : null
    if (!last || last < midnight) {
      await supabase.from('users').update({
        public_coins: 100,
        last_coins_granted_at: now.toISOString(),
        public_questions_created_today: 0,
        public_questions_reset_at: now.toISOString(),
      }).eq('id', user.id)
      count++
    }
  }

  return NextResponse.json({ success: true, updated: count })
}
