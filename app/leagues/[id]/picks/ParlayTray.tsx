'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getParlayMultiplier } from '@/lib/parlay'

export type ParlayLeg = {
  questionId: string
  question: string
  pick: 'a' | 'b'
  option_a: string
  option_b: string
}

interface Props {
  legs: ParlayLeg[]
  tokens: number
  tokenSymbol: string
  leagueId: string
  onRemoveLeg: (questionId: string) => void
  onClear: () => void
}

export function ParlayTray({ legs, tokens, tokenSymbol, leagueId, onRemoveLeg, onClear }: Props) {
  const router = useRouter()
  const [wager, setWager] = useState(0)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  if (legs.length === 0) return null

  const multiplier = legs.length >= 2 && legs.length <= 6 ? getParlayMultiplier(legs.length) : 0
  const projectedPayout = multiplier > 0 ? Math.min(500, Math.floor(wager * multiplier)) : 0
  const canSubmit = legs.length >= 2 && wager > 0 && wager <= tokens && !loading

  const submitParlay = async () => {
    setLoading(true)
    setMsg('')
    const res = await fetch(`/api/leagues/${leagueId}/parlays`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wager, legs }),
    })
    const data = await res.json()
    if (!res.ok) { setMsg(data.error); setLoading(false); return }
    setMsg('✅ Parlay placed!')
    setWager(0)
    onClear()
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0f0f0f] border-t border-[#1f1f1f] shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-syne font-bold text-green-400">
            Parlay ({legs.length} leg{legs.length !== 1 ? 's' : ''})
          </h3>
          <button onClick={onClear} className="text-xs text-gray-600 hover:text-gray-300">Clear</button>
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {legs.map(leg => (
            <div key={leg.questionId} className="flex items-center gap-1.5 bg-[#1a1a1a] rounded-lg px-3 py-1.5 text-xs">
              <span className={`font-bold ${leg.pick === 'a' ? 'text-green-400' : 'text-red-400'}`}>
                {leg.pick === 'a' ? leg.option_a : leg.option_b}
              </span>
              <span className="text-gray-500 truncate max-w-28">{leg.question}</span>
              <button onClick={() => onRemoveLeg(leg.questionId)} className="text-gray-600 hover:text-gray-300 ml-1">✕</button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="number" min={1} max={tokens} value={wager || ''}
            onChange={e => setWager(Math.min(parseInt(e.target.value) || 0, tokens))}
            placeholder="Wager" className="w-24 bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-600" />
          <span className="text-xs text-gray-500">{tokenSymbol}</span>
          {multiplier > 0 && (
            <div className="text-xs text-gray-400">
              <span className="text-green-400 font-bold">{multiplier}x</span>
              {wager > 0 && <span className="ml-2">→ win <span className="text-green-400 font-bold">{projectedPayout}{tokenSymbol}</span></span>}
            </div>
          )}
          {legs.length < 2 && <span className="text-xs text-gray-600">Add {2 - legs.length} more leg{legs.length === 0 ? 's' : ''}</span>}
          <button onClick={submitParlay} disabled={!canSubmit}
            className={`btn-primary text-sm px-4 py-2 ${!canSubmit ? 'opacity-50 cursor-not-allowed' : ''}`}>
            {loading ? 'Placing...' : `Place Parlay (${multiplier || 0}x)`}
          </button>
          {msg && <span className="text-xs text-gray-300">{msg}</span>}
        </div>
      </div>
    </div>
  )
}
