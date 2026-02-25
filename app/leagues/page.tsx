import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeaguesPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('league_members')
    .select('*, leagues(*)')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const leagues = memberships?.map(m => m.leagues) ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne text-3xl font-bold">Your Leagues</h1>
          <p className="text-gray-500 text-sm mt-1">Pick a league or create your own</p>
        </div>
        <div className="flex gap-2">
          <Link href="/leagues/join" className="btn-ghost text-sm">Join League</Link>
          <Link href="/leagues/create" className="btn-primary text-sm">+ Create</Link>
        </div>
      </div>

      {leagues.length === 0 ? (
        <div className="text-center py-24 card">
          <div className="text-5xl mb-4">🏆</div>
          <p className="font-syne text-xl font-bold mb-2">No leagues yet</p>
          <p className="text-gray-500 text-sm mb-6">Create one or join with a code</p>
          <div className="flex gap-3 justify-center">
            <Link href="/leagues/join" className="btn-ghost">Join League</Link>
            <Link href="/leagues/create" className="btn-primary">Create League</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {leagues.map((league: any) => (
            <Link key={league.id} href={`/leagues/${league.id}`}
              className="card p-5 hover:border-green-900/50 transition-colors block">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-syne font-bold text-lg">{league.name}</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {league.token_symbol} {league.token_name}
                  </p>
                </div>
                <div className="text-green-500 text-2xl">→</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
