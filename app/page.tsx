import Link from 'next/link'
import { getSessionUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const user = await getSessionUser()
  if (user) redirect('/leagues')

  return (
    <div className="max-w-2xl mx-auto pt-24 text-center">
      <h1 className="font-syne text-5xl font-bold mb-4">
        Pick'em
      </h1>
      <p className="text-gray-400 text-xl mb-2">Predict. Compete. Win.</p>
      <p className="text-gray-600 text-sm mb-12">Join leagues with friends or bet on the public feed</p>
      <div className="flex gap-4 justify-center">
        <Link href="/join" className="btn-primary text-lg px-8 py-3">
          Get Started
        </Link>
        <Link href="/login" className="btn-ghost text-lg px-8 py-3">
          Sign In
        </Link>
      </div>
      <div className="mt-16 grid grid-cols-3 gap-6 text-center">
        <div className="card p-6">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-syne font-bold mb-1">Private Leagues</h3>
          <p className="text-xs text-gray-500">Compete with friends in your own league</p>
        </div>
        <div className="card p-6">
          <div className="text-3xl mb-2">🌍</div>
          <h3 className="font-syne font-bold mb-1">Public Feed</h3>
          <p className="text-xs text-gray-500">Bet on community questions with daily coins</p>
        </div>
        <div className="card p-6">
          <div className="text-3xl mb-2">🪙</div>
          <h3 className="font-syne font-bold mb-1">Win Coins</h3>
          <p className="text-xs text-gray-500">Pool betting — back the right side to win big</p>
        </div>
      </div>
    </div>
  )
}
