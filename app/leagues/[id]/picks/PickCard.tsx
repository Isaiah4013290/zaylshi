'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ParlayLeg } from './ParlayTray'

interface Props {
  question: any
  userPick: any
  tokens: number
  tokenSymbol: string
  leagueId: string
  parlayLegs: ParlayLeg[]
  onAddToParlay: (leg: ParlayLeg) => void
  onRemoveFromParlay: (questionId: string) => void
}

export function PickCard({ question, userPick, tokens, tokenSymbol, leagueId, parlayLegs, onAddToParlay, onRemoveFromParlay }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPick, setSelectedPick] = useState<'a' | 'b' | null>(userPick?.pick ?? null)
  const [wager, setWager] = useState<number>(userPick?.wager ?? 0)
  const [error, setError] = useState('')
  const locked = new Date(question.closes_at) <= new Date()
  const isOpen = question.status === 'open' && !locked
  const inParlay = parlayLegs.find(l => l.questionId === question.id)

  const submitPick = (pick: 'a' | 'b', wagerAmount: number) => {
    setError('')
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/picks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, pick, wager: wagerAmount }),
      })
      const data = await res.json()
      if (!res.ok) setError(data.error)
      else router.refresh()
    })
  }

  const handlePick = (pick: 'a' | 'b') => {
    if (locked) return
    setSelectedPick(pick)
    submitPick(pick, wager)
  }

  const handleWagerSubmit = () => {
    if (!selectedPick) { setError('Make a pick first'); return }
    submitPick(selectedPick, wager)
  }

  const handleParlayPick = (pick: 'a' | 'b') => {
    onAddToParlay({ questionId: question.id, question: question.question, pick, option_a: question.option_a, option_b: question.option_b })
  }

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-syne font-bold text-lg leading-snug">{question.question}</p>
          <span className="text-xs text-gray-600">{question.pick_type === 'pool' ? '🏊 Pool mode' : '⚡ Fixed 2x'}</span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
          question.status === 'graded' ? 'bg-[#1f1f1f] text-gray-400' :
          locked ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'
        }`}>
          {question.status === 'graded' ? 'Graded' : locked ? 'Closed' : 'Open'}
        </span>
      </div>

      {isOpen && (
        <p className="text-xs text-gray-600 mb-4">
          🔓 Closes {new Date(question.closes_at).toLocaleString()}
        </p>
      )}

      {isOpen ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handlePick('a')} disabled={isPending}
              className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                selectedPick === 'a'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-green-900/10 border-green-900/30 text-green-400 hover:bg-green-900/20'
              }`}>
              {selectedPick === 'a' ? '✓ ' : ''}{question.option_a}
            </button>
            <button onClick={() => handlePick('b')} disabled={isPending}
              className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                selectedPick === 'b'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/20'
              }`}>
              {selectedPick === 'b' ? '✓ ' : ''}{question.option_b}
            </button>
          </div>

          {selectedPick && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-500">Wager</span>
              <input type="number" min={0} max={tokens + (userPick?.wager ?? 0)} value={wager}
                onChange={e => setWager(Math.min(parseInt(e.target.value) || 0, tokens + (userPick?.wager ?? 0)))}
                className="w-20 bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-green-600" />
              <span className="text-xs text-gray-500">{tokenSymbol} = win {wager * 2}{tokenSymbol}</span>
              <button onClick={handleWagerSubmit} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 ml-auto">
                {isPending ? '...' : 'Confirm'}
              </button>
            </div>
          )}

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {question.pick_type === 'fixed' && (
            <div className="border-t border-[#1f1f1f] pt-3">
              <p className="text-xs text-gray-600 mb-2">➕ Add to Parlay</p>
              {inParlay ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400">Added as <strong>{inParlay.pick === 'a' ? question.option_a : question.option_b}</strong></span>
                  <button onClick={() => onRemoveFromParlay(question.id)} className="text-xs text-gray-600 hover:text-red-400">Remove</button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleParlayPick('a')}
                    className="py-1.5 rounded-lg text-xs border border-green-900/40 text-green-400 hover:bg-green-900/20">
                    {question.option_a} (parlay)
                  </button>
                  <button onClick={() => handleParlayPick('b')}
                    className="py-1.5 rounded-lg text-xs border border-red-900/40 text-red-400 hover:bg-red-900/20">
                    {question.option_b} (parlay)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : userPick ? (
        <div className={`rounded-xl px-4 py-3 text-sm text-center ${
          userPick.is_correct === true ? 'bg-green-900/20 border border-green-900/40 text-green-300' :
          userPick.is_correct === false ? 'bg-red-900/20 border border-red-900/40 text-red-300' :
          'bg-[#1a1a1a] text-gray-400'
        }`}>
          {userPick.is_correct === true && '✅ '}
          {userPick.is_correct === false && '❌ '}
          You picked <strong>{userPick.pick === 'a' ? question.option_a : question.option_b}</strong>
          {userPick.wager > 0 && <span className="ml-2 opacity-70">· {userPick.wager}{tokenSymbol} wagered</span>}
          {userPick.payout != null && (
            <span className={`ml-2 font-bold ${userPick.payout > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {userPick.payout > 0 ? `+${userPick.payout}` : userPick.payout}{tokenSymbol}
            </span>
          )}
          {question.status === 'graded' && question.correct_answer && (
            <p className="text-xs mt-1 opacity-60">
              Correct: {question.correct_answer === 'a' ? question.option_a : question.option_b}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl px-4 py-3 text-sm text-center bg-[#1a1a1a] text-gray-600">
          {question.status === 'graded'
            ? `Answer: ${question.correct_answer === 'a' ? question.option_a : question.option_b} · No pick made`
            : 'Closed — no pick made'}
        </div>
      )}
    </div>
  )
}
