'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinLeaguePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/leagues/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    if (data.pending) {
      router.push('/pending')
    } else {
      router.push(`/leagues/${data.leagueId}`)
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-bold">Join a League</h1>
        <p className="text-gray-500 text-sm mt-1">Enter the join code from your league admin</p>
      </div>
      <div className="card p-6">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Join Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              className="input-field font-mono text-center text-lg tracking-widest"
              placeholder="ABC12345" required />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Joining...' : 'Join League'}
          </button>
        </form>
      </div>
    </div>
  )
}
