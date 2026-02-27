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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    router.push('/leagues')
  }

  return (
    <div className="max-w-sm mx-auto pt-16">
      <div className="text-center mb-8">
        <h1 className="font-syne text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-gray-500 text-sm">Sign in to your account</p>
      </div>
      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              className="input-field" placeholder="your username" required />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" required />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="flex justify-between mt-4 text-sm">
          <Link href="/forgot-password" className="text-gray-500 hover:text-white">Forgot password?</Link>
          <Link href="/join" className="text-green-400 hover:text-green-300">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
