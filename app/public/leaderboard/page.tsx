import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const { data: users } = await supabase
    .from('users')
    .select('username, lifetime_coins_earned, lifetime_coins_wagered')
    .order('lifetime_coins_wagered', { ascending: false })
    .limit(50)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-syne text-3xl font-bold">Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">Top 50 all-time public players</p>
        </div>
        <Link href="/public" className="btn-ghost text-sm">← Public Feed</Link>
      </div>

      <div className="card overflow-hidden">
        <div className="grid grid-cols-12 px-5 py-3 text-xs text-gray-600 border-b border-[#1f1f1f] uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-5">Username</div>
          <div className="col-span-3 text-right">Wagered</div>
          <div className="col-span-3 text-right">Earned</div>
        </div>
        {users?.map((u, i) => (
          <div key={u.username} className={`grid grid-cols-12 px-5 py-4 border-b border-[#1f1f1f]/40 text-sm items-center ${
            i === 0 ? 'bg-amber-900/10' : i === 1 ? 'bg-gray-800/20' : i === 2 ? 'bg-orange-900/10' : 'hover:bg-white/5'
          }`}>
            <div className="col-span-1 font-bold text-gray-400">
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
            </div>
            <div className="col-span-5 font-medium">@{u.username}</div>
            <div className="col-span-3 text-right text-green-400 font-bold">{u.lifetime_coins_wagered ?? 0}🪙</div>
            <div className="col-span-3 text-right text-gray-400">{u.lifetime_coins_earned ?? 0}🪙</div>
          </div>
        ))}
        {(!users || users.length === 0) && (
          <div className="px-5 py-12 text-center text-gray-600">No players yet</div>
        )}
      </div>
    </div>
  )
}
