import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user || !user.is_super_admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await supabase.from('league_picks').delete().eq('league_id', id)
  await supabase.from('league_questions').delete().eq('league_id', id)
  await supabase.from('league_messages').delete().eq('league_id', id)
  await supabase.from('league_members').delete().eq('league_id', id)
  await supabase.from('leagues').delete().eq('id', id)

  return NextResponse.json({ success: true })
}
