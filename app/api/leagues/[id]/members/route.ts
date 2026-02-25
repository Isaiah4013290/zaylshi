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
    const { data: league } = await supabase
      .from('leagues')
      .select('starting_tokens')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase
      .from('league_members')
      .update({ status: 'approved', tokens: league?.starting_tokens ?? 100 })
      .eq('league_id', id)
      .eq('user_id', memberId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else if (action === 'deny') {
    await supabase
      .from('league_members')
      .delete()
      .eq('league_id', id)
      .eq('user_id', memberId)
  }

  return NextResponse.json({ success: true })
}
