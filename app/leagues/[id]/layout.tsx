import { redirect } from 'next/navigation'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LeagueLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('league_members')
    .select('role, status, tokens, leagues(name, token_name, token_symbol)')
    .eq('league_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership || membership.status !== 'approved') redirect('/leagues')

  const league = membership.leagues as any
  const isAdmin = membership.role === 'owner' || membership.role === 'admin'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/leagues" className="text-gray-500 hover:text-white text-sm">← Leagues</Link>
          </div>
          <h1 className="font-syne text-2xl font-bold mt-1">{league.name}</h1>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{league.token_name}</p>
          <p className="font-syne font-bold text-green-500 text-xl">
            {league.token_symbol} {membership.tokens}
          </p>
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-[#1f1f1f] pb-3 overflow-x-auto">
        {[
          { href: `/leagues/${id}`, label: 'Picks' },
          { href: `/leagues/${id}/leaderboard`, label: 'Board' },
          { href: `/leagues/${id}/chat`, label: 'Chat' },
          ...(isAdmin ? [{ href: `/leagues/${id}/admin`, label: 'Admin' }] : []),
        ].map(tab => (
          <Link key={tab.href} href={tab.href}
            className="text-sm px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap">
            {tab.label}
          </Link>
        ))}
      </div>

      {children}
    </div>
  )
}
