'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateLeaguePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [tokenName, setTokenName] = useState('Tokens')
  const [tokenSymbol, setTokenSymbol] = useState('🪙')
  const [joinMode, setJoinMode] = useState<'auto_join' | 'admin_approval'>('admin_approval')
  const [startingTokens, setStartingTokens] = useState(100)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/leagues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, tokenName, tokenSymbol, joinMode, startingTokens }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push(`/leagues/${data.leagueId}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <h1 className="font-syne text-3xl font-bold">Create a League</h1>
        <p className="text-gray-500 text-sm mt-1">Set up your prediction league</p>
      </div>
      <div className="card p-6">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">League Name</label>
            <input value={name} onChange={e => setName(e.target.value)}
              className="input-field" placeholder="Freeman Pick'em" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Token Name</label>
              <input value={tokenName} onChange={e => setTokenName(e.target.value)}
                className="input-field" placeholder="Tokens" required />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Token Symbol</label>
              <input value={tokenSymbol} onChange={e => setTokenSymbol(e.target.value)}
                className="input-field" placeholder="🪙" required />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Starting Tokens</label>
            <input type="number" value={startingTokens} onChange={e => setStartingTokens(parseInt(e.target.value))}
              className="input-field" min={0} required />
          </div>
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Join Mode</label>
            <select value={joinMode} onChange={e => setJoinMode(e.target.value as any)}
              className="input-field">
              <option value="admin_approval">Admin Approval Required</option>
              <option value="auto_join">Anyone Can Join</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating...' : 'Create League'}
          </button>
        </form>
      </div>
    </div>
  )
}
