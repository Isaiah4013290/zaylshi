import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { ProfileClient } from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('username, phone, phone_verified, public_coins, lifetime_coins_earned, lifetime_coins_wagered, created_at')
    .eq('id', user.id)
    .single()

  return <ProfileClient user={userData} />
}
