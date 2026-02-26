import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { GamesClient } from './GamesClient'

export const dynamic = 'force-dynamic'

export default async function PicksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('league_members')
    .select('tokens, status, role')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.status !== 'approved') redirect(`/leagues/${id}`)

  const { data: league } = await supabase
    .from('leagues')
    .select('token_name, token_symbol, bio')
    .eq('id', id)
    .maybeSingle()

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

  const now = new Date()
  const open = questions?.filter(q => q.status === 'open' && new Date(q.closes_at) > now) ?? []
  const closed = questions?.filter(q => q.status !== 'open' || new Date(q.closes_at) <= now) ?? []

  return (
    <GamesClient
      leagueId={id}
      user={user}
      open={open}
      closed={closed}
      picksByQuestion={picksByQuestion}
      tokens={membership.tokens}
      tokenName={league?.token_name ?? 'Tokens'}
      tokenSymbol={league?.token_symbol ?? '🪙'}
      bio={league?.bio ?? ''}
    />
  )
}
