'use client'

import { useState, useTransition } from 'react'

export function SuperAdminClient({ leagues, users }: { leagues: any[], users: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [msg, setMsg] = useState('')
  const [leagueList, setLeagueList] = useState(leagues)

  const deleteLeague = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const res = await fetch(`/api/super-admin/delete-league?id=${id}`)
      if (res.ok || res.redirected) {
        setLeagueList(prev => prev.filter(l => l.id !== id))
        setMsg('✅ League deleted!')
        setTimeout(() => setMsg(''), 3000)
      } else {
        setMsg('❌ Error deleting league')
      }
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-bold">Super Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Full platform control</p>
      </div>

      {msg && <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-sm">{msg}</div>}

      <div className="space-y-10">
        <section>
          <h2 className="font-syne text-xl font-bold mb-4">All Leagues ({leagueList.length})</h2>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 text-xs text-gray-600 border-b border-[#1f1f1f] uppercase tracking-wider">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Join Mode</div>
              <div className="col-span-3">Code</div>
              <div className="col-span-2">Delete</div>
            </div>
            {leagueList.map((league: any) => (
              <div key={league.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#1f1f1f]/40 text-sm hover:bg-white/5 items-center">
                <div className="col-span-4 font-medium">{league.name}</div>
                <div className="col-span-3 text-gray-400">{league.join_mode}</div>
                <div className="col-span-3 font-mono text-green-500 text-xs">{league.join_code}</div>
                <div className="col-span-2">
                  <button onClick={() => deleteLeague(league.id, league.name)} disabled={isPending}
                    className="text-xs px-2 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {leagueList.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">No leagues yet</div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-syne text-xl font-bold mb-4">All Users ({users.length})</h2>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 text-xs text-gray-600 border-b border-[#1f1f1f] uppercase tracking-wider">
              <div className="col-span-4">Username</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-2">Joined</div>
            </div>
            {users.map((u: any) => (
              <div key={u.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#1f1f1f]/40 text-sm hover:bg-white/5 items-center">
                <div className="col-span-4 font-medium">@{u.username}</div>
                <div className="col-span-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    u.status === 'approved' ? 'bg-green-900/40 text-green-400' :
                    u.status === 'pending' ? 'bg-amber-900/40 text-amber-400' :
                    'bg-red-900/40 text-red-400'
                  }`}>{u.status}</span>
                </div>
                <div className="col-span-3 text-gray-400">
                  {u.is_super_admin ? '👑 Super Admin' : u.is_admin ? '🛡️ Admin' : 'Member'}
                </div>
                <div className="col-span-2 text-gray-500 text-xs">
                  {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
