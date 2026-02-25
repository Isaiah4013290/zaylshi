import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { GamesClient } from './picks/GamesClient'

export const dynamic = 'force-dynamic'

export default async function LeaguePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('league_members')
    .select('tokens, role, leagues(token_name, token_symbol)')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) redirect('/leagues')

  const { data: questions } = await supabase
    .from('league_questions')
    .select('*')
    .eq('league_id', id)
    .order('created_at', { ascending: false })

  const { data: picks } = await supabase
    .from('league_picks')
    .select('*')
    .eq('league_id', id)
    .eq('user_id', user.id)

  const picksByQuestion: Record<string, any> = {}
  picks?.forEach(p => { picksByQuestion[p.question_id] = p })

  const open = questions?.filter(q => q.status === 'open') ?? []
  const closed = questions?.filter(q => q.status !== 'open') ?? []
  const league = membership.leagues as any

  return (
    <GamesClient
      leagueId={id}
      user={user}
      open={open}
      closed={closed}
      picksByQuestion={picksByQuestion}
      tokens={membership.tokens}
      tokenName={league.token_name}
      tokenSymbol={league.token_symbol}
    />
  )
}
