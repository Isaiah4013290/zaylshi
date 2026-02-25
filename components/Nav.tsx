import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'

export async function Nav() {
  const user = await getSessionUser()

  if (!user) return null

  return (
    <nav className="border-b border-[#1f1f1f] bg-[#0a0a0a] sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/leagues" className="font-syne text-xl font-bold text-green-500">
          Pick'em
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/leagues" className="text-sm text-gray-400 hover:text-white transition-colors">
            Leagues
          </Link>
          {user.is_super_admin && (
            <Link href="/super-admin" className="text-sm text-red-400 hover:text-red-300 transition-colors">
              Super Admin
            </Link>
          )}
          <span className="text-sm text-gray-500">@{user.username}</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">
              Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
