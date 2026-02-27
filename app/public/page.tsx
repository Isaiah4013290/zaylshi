import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { PublicFeed } from './PublicFeed'

export const dynamic = 'force-dynamic'

export default async function PublicPage() {
  const user = await getSessionUser()

  const { data: questions } = await supabase
    .from('public_questions')
    .select('*, users(username)')
    .eq('status', 'open')
    .gt('closes_at', new Date().toISOString())
    .order('unique_voters', { ascending: false })

  const { data: myPicks } = user ? await supabase
    .from('public_picks')
    .select('*')
    .eq('user_id', user.id) : { data: [] }

  const { data: userData } = user ? await supabase
    .from('users')
    .select('phone_verified, public_coins')
    .eq('id', user.id)
    .single() : { data: null }

  const picksByQuestion: Record<string, any> = {}
  myPicks?.forEach(p => { picksByQuestion[p.question_id] = p })

  return (
    <PublicFeed
      questions={questions ?? []}
      picksByQuestion={picksByQuestion}
      user={user}
      phoneVerified={userData?.phone_verified ?? false}
      publicCoins={userData?.public_coins ?? 0}
    />
  )
}
