import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { SuperAdminClient } from './SuperAdminClient'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const user = await getSessionUser()
  if (!user || !user.is_super_admin) redirect('/leagues')

  const { data: leagues } = await supabase
    .from('leagues')
    .select('id, name, join_code, join_mode, created_by, users(username)')
    .order('created_at', { ascending: false })

  const { data: users } = await supabase
    .from('users')
    .select('id, username, status, is_admin, is_super_admin, created_at')
    .order('created_at', { ascending: false })

  const leaguesWithCreator = leagues?.map((l: any) => ({
    ...l,
    creator_username: l.users?.username
  })) ?? []

  return <SuperAdminClient leagues={leaguesWithCreator} users={users ?? []} />
}
