'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/pending')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-syne text-4xl font-bold text-green-500">Pick'em</h1>
          <p className="text-gray-500 mt-2 text-sm">Request access to join</p>
        </div>
        <div className="card p-6">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Choose a username</label>
              <input value={username} onChange={e => setUsername(e.target.value.toLowerCase().trim())}
                className="input-field" placeholder="coolname123" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Requesting...' : 'Request Access'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-4">
            Already have access? <Link href="/login" className="text-green-500 hover:text-green-400">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
