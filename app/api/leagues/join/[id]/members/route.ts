import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Not logged in' }, { status: 401 })

  const { data: adminCheck } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminCheck || (adminCheck.role !== 'owner' && adminCheck.role !== 'admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { memberId, action } = await req.json()

  if (action === 'approve') {
    const { data: member } = await supabase
      .from('league_members')
      .select('league_id')
      .eq('id', memberId)
      .maybeSingle()

    const { data: league } = await supabase
      .from('leagues')
      .select('starting_tokens')
      .eq('id', member?.league_id)
      .maybeSingle()

    await supabase
      .from('league_members')
      .update({ status: 'approved', tokens: league?.starting_tokens ?? 100 })
      .eq('id', memberId)
  } else if (action === 'deny') {
    await supabase
      .from('league_members')
      .delete()
      .eq('id', memberId)
  }

  return NextResponse.json({ success: true })
}
