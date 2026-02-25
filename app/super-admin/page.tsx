import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function SuperAdminPage() {
  const user = await getSessionUser()
  if (!user || !user.is_super_admin) redirect('/leagues')

  const { data: leagues } = await supabase
    .from('leagues')
    .select('*, users(username)')
    .order('created_at', { ascending: false })

  const { data: users } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-bold">Super Admin</h1>
        <p className="text-gray-500 text-sm mt-1">Full platform control</p>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="font-syne text-xl font-bold mb-4">All Leagues ({leagues?.length ?? 0})</h2>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 text-xs text-gray-600 border-b border-[#1f1f1f] uppercase tracking-wider">
              <div className="col-span-4">Name</div>
              <div className="col-span-3">Owner</div>
              <div className="col-span-2">Join Mode</div>
              <div className="col-span-2">Code</div>
              <div className="col-span-1">Delete</div>
            </div>
            {leagues?.map((league: any) => (
              <div key={league.id} className="grid grid-cols-12 px-5 py-4 border-b border-[#1f1f1f]/40 text-sm hover:bg-white/5 items-center">
                <div className="col-span-4 font-medium">{league.name}</div>
                <div className="col-span-3 text-gray-400">@{league.users?.username}</div>
                <div className="col-span-2 text-gray-400">{league.join_mode}</div>
                <div className="col-span-2 font-mono text-green-500 text-xs">{league.join_code}</div>
                <div className="col-span-1">
                  <DeleteLeagueButton leagueId={league.id} />
                </div>
              </div>
            ))}
            {leagues?.length === 0 && (
              <div className="px-5 py-8 text-center text-gray-600 text-sm">No leagues yet</div>
            )}
          </div>
        </section>

        <section>
          <h2 className="font-syne text-xl font-bold mb-4">All Users ({users?.length ?? 0})</h2>
          <div className="card overflow-hidden">
            <div className="grid grid-cols-12 px-5 py-3 text-xs text-gray-600 border-b border-[#1f1f1f] uppercase tracking-wider">
              <div className="col-span-4">Username</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3">Role</div>
              <div className="col-span-2">Joined</div>
            </div>
            {users?.map((u: any) => (
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

function DeleteLeagueButton({ leagueId }: { leagueId: string }) {
  return (
    <form action={`/api/super-admin/leagues/${leagueId}`} method="POST">
      <DeleteButton leagueId={leagueId} />
    </form>
  )
}

function DeleteButton({ leagueId }: { leagueId: string }) {
  return (
    <a href={`/api/super-admin/delete-league?id=${leagueId}`}
      onClick={(e) => { if (!confirm('Delete this league? This cannot be undone.')) e.preventDefault() }}
      className="text-xs px-2 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50">
      🗑️
    </a>
  )
}
