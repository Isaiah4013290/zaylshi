'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    if (data.needsPassword) { router.push(`/set-password?user=${data.user}`); return }
    router.push('/leagues')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-syne text-4xl font-bold text-green-500">Pick'em</h1>
          <p className="text-gray-500 mt-2 text-sm">Predict. Compete. Win.</p>
        </div>
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="input-field" placeholder="your username" required />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input-field" placeholder="••••••••" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            No account? <Link href="/join" className="text-green-500 hover:text-green-400">Request access</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
