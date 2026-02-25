import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ChatClient } from './ChatClient'

export const dynamic = 'force-dynamic'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('league_members')
    .select('role')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect('/leagues')

  const { data: messages } = await supabase
    .from('league_messages')
    .select('*, users(username)')
    .eq('league_id', id)
    .eq('deleted', false)
    .order('created_at', { ascending: true })
    .limit(100)

  const isAdmin = membership.role === 'owner' || membership.role === 'admin'

  return (
    <ChatClient
      leagueId={id}
      currentUser={user}
      initialMessages={messages ?? []}
      isAdmin={isAdmin}
    />
  )
}
