import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'

export async function Nav() {
  const user = await getSessionUser()

  return (
    <nav className="border-b border-[#1f1f1f] bg-[#0a0a0a] sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href={user ? '/leagues' : '/'} className="font-syne text-xl font-bold text-green-500">
          Pick'em
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/public" className="text-sm text-gray-400 hover:text-white transition-colors">
                Public
              </Link>
              <Link href="/leagues" className="text-sm text-gray-400 hover:text-white transition-colors">
                Leagues
              </Link>
              {user.is_super_admin && (
                <Link href="/super-admin" className="text-sm text-red-400 hover:text-red-300 transition-colors">
                  Super Admin
                </Link>
              )}
              <Link href="/profile" className="text-sm text-gray-500 hover:text-white transition-colors">
                @{user.username}
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button type="submit" className="text-sm text-gray-500 hover:text-white transition-colors">
                  Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/public" className="text-sm text-gray-400 hover:text-white transition-colors">
                Public
              </Link>
              <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                Login
              </Link>
              <Link href="/join" className="btn-primary text-sm px-4 py-1.5">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
