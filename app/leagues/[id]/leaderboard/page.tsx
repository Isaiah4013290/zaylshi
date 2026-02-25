import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: members } = await supabase
    .from('league_members')
    .select('tokens, role, users(username)')
    .eq('league_id', id)
    .eq('status', 'approved')
    .order('tokens', { ascending: false })

  const { data: league } = await supabase
    .from('leagues')
    .select('token_name, token_symbol')
    .eq('id', id)
    .single()

  const myRank = members?.findIndex((m: any) => m.users?.username === user.username) ?? -1
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div>
      <h2 className="font-syne text-2xl font-bold mb-6">Leaderboard</h2>

      {myRank >= 0 && (
        <div className="bg-green-900/20 border border-green-900/40 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <span className="text-green-400 text-sm font-medium">Your rank</span>
          <span className="font-syne font-bold text-2xl text-green-400">#{myRank + 1}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-xs text-gray-600 border-b border-[#1f1f1f] uppercase tracking-wider">
          <div className="col-span-1">#</div>
          <div className="col-span-7">Player</div>
          <div className="col-span-4 text-right">{league?.token_symbol} {league?.token_name}</div>
        </div>
        {members?.map((m: any, i: number) => (
          <div key={i} className={`grid grid-cols-12 px-5 py-4 border-b border-[#1f1f1f]/40 ${m.users?.username === user.username ? 'bg-green-900/10' : 'hover:bg-white/5'}`}>
            <div className="col-span-1 text-gray-500 text-sm">{i < 3 ? medals[i] : i + 1}</div>
            <div className="col-span-7 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#1f1f1f] flex items-center justify-center text-xs font-bold">
                {m.users?.username?.[0]?.toUpperCase()}
              </div>
              <span className={`font-medium text-sm ${m.users?.username === user.username ? 'text-green-400' : ''}`}>
                {m.users?.username}
                {m.users?.username === user.username && <span className="text-xs ml-1 text-green-700"> you</span>}
              </span>
            </div>
            <div className="col-span-4 text-right font-syne font-bold text-green-500">{m.tokens}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
