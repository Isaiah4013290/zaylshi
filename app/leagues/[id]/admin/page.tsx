import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { AdminActions } from './AdminActions'

export const dynamic = 'force-dynamic'

export default async function AdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
    redirect(`/leagues/${id}`)
  }

  const { data: league } = await supabase
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  const { data: questions } = await supabase
    .from('league_questions')
    .select('*')
    .eq('league_id', id)
    .order('created_at', { ascending: false })

  const { data: members } = await supabase
    .from('league_members')
    .select('*, users(username)')
    .eq('league_id', id)
    .order('joined_at', { ascending: true })

  const pending = members?.filter(m => m.status === 'pending') ?? []
  const approved = members?.filter(m => m.status === 'approved') ?? []

  return (
    <AdminActions
      leagueId={id}
      league={league}
      questions={questions ?? []}
      pendingMembers={pending}
      approvedMembers={approved}
      isSuperAdmin={user.is_super_admin}
    />
  )
}
