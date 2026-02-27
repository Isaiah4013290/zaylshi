'use client'

import { useState, useTransition } from 'react'

interface Props {
  question: any
  userPick: any
  user: any
  phoneVerified: boolean
  publicCoins: number
  onPickMade: (questionId: string, pick: any, newCoins: number) => void
  onVerifyNeeded: () => void
}

export function PublicQuestionCard({ question, userPick, user, phoneVerified, publicCoins, onPickMade, onVerifyNeeded }: Props) {
  const [isPending, startTransition] = useTransition()
  const [selectedPick, setSelectedPick] = useState<'a' | 'b' | null>(userPick?.pick ?? null)
  const [wager, setWager] = useState<number>(0)
  const [error, setError] = useState('')
  const [showGrade, setShowGrade] = useState(false)
  const [graded, setGraded] = useState(question.status === 'graded')
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer)
  const [coinsA, setCoinsA] = useState<number>(question.coins_a ?? 0)
  const [coinsB, setCoinsB] = useState<number>(question.coins_b ?? 0)
  const [totalVoters, setTotalVoters] = useState<number>(question.unique_voters ?? 0)
  const [votersA, setVotersA] = useState<number>(question.unique_voters_a ?? 0)
  const [votersB, setVotersB] = useState<number>(question.unique_voters_b ?? 0)
  const [deleted, setDeleted] = useState(false)

  const pctA = totalVoters > 0 ? Math.round((votersA / totalVoters) * 100) : 50
  const pctB = totalVoters > 0 ? Math.round((votersB / totalVoters) * 100) : 50
  const totalPot = coinsA + coinsB

  const multiplierA = coinsA > 0 ? (totalPot / coinsA).toFixed(2) : null
  const multiplierB = coinsB > 0 ? (totalPot / coinsB).toFixed(2) : null

  const userWouldWin = wager > 0 && selectedPick === 'a' && coinsA > 0
    ? Math.floor(wager * (totalPot + wager) / (coinsA + wager))
    : wager > 0 && selectedPick === 'b' && coinsB > 0
    ? Math.floor(wager * (totalPot + wager) / (coinsB + wager))
    : wager > 0 ? wager : 0

  const isOwner = user?.id === question.created_by
  const locked = new Date(question.closes_at) <= new Date()

  const handlePick = (pick: 'a' | 'b') => {
    if (!user) return
    if (!phoneVerified) { onVerifyNeeded(); return }
    setSelectedPick(pick)
  }

  const handleConfirm = () => {
    if (!selectedPick) { setError('Select an option first'); return }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/public/picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, pick: selectedPick, wager }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      if (selectedPick === 'a') {
        setCoinsA((prev: number) => prev + wager)
        setVotersA((prev: number) => prev + 1)
      } else {
        setCoinsB((prev: number) => prev + wager)
        setVotersB((prev: number) => prev + 1)
      }
      setTotalVoters((prev: number) => prev + 1)
      onPickMade(question.id, { pick: selectedPick, wager }, publicCoins - wager)
    })
  }

  const handleGrade = (answer: 'a' | 'b') => {
    startTransition(async () => {
      const res = await fetch('/api/public/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, correct_answer: answer }),
      })
      if (res.ok) {
        setGraded(true)
        setCorrectAnswer(answer)
        setShowGrade(false)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Delete this question? This cannot be undone.')) return
    startTransition(async () => {
      const res = await fetch('/api/public/questions/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id }),
      })
      if (res.ok) setDeleted(true)
    })
  }

  if (deleted) return null

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-syne font-bold text-lg leading-snug">{question.question}</p>
          <p className="text-xs text-gray-600 mt-1">
            by @{question.users?.username} · {totalVoters} voters · closes {new Date(question.closes_at).toLocaleDateString()}
          </p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
          graded ? 'bg-[#1f1f1f] text-gray-400' :
          locked ? 'bg-red-900/30 text-red-400' :
          'bg-green-900/30 text-green-400'
        }`}>
          {graded ? 'Graded' : locked ? 'Closed' : 'Open'}
        </span>
      </div>

      {/* % bars */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-green-400 font-medium">{question.option_a}</span>
          <span className="text-red-400 font-medium">{question.option_b}</span>
        </div>
        <div className="h-2 rounded-full bg-[#1f1f1f] overflow-hidden flex mb-2">
          <div className="bg-green-600 h-full transition-all" style={{ width: `${pctA}%` }} />
          <div className="bg-red-600 h-full transition-all" style={{ width: `${pctB}%` }} />
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-green-500">{pctA}% · {coinsA}🪙</span>
          <span className="text-gray-600">{totalVoters} voters · {totalPot}🪙 pot</span>
          <span className="text-red-500">{coinsB}🪙 · {pctB}%</span>
        </div>
      </div>

      {/* Multipliers */}
      {!graded && (
        <div className="flex justify-between items-center bg-[#111] rounded-xl px-4 py-2.5 mb-4 text-xs">
          <div className="text-center">
            <p className="text-gray-500 mb-0.5">{question.option_a}</p>
            <p className="text-green-400 font-bold text-base">{multiplierA ? `${multiplierA}x` : '—'}</p>
          </div>
          <div className="text-center text-gray-600">
            <p>multiplier</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 mb-0.5">{question.option_b}</p>
            <p className="text-red-400 font-bold text-base">{multiplierB ? `${multiplierB}x` : '—'}</p>
          </div>
        </div>
      )}

      {/* Pick buttons */}
      {!graded && !locked && !userPick && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handlePick('a')} disabled={isPending || isOwner}
              className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                selectedPick === 'a'
                  ? 'bg-green-600 border-green-500 text-white'
                  : 'bg-green-900/10 border-green-900/30 text-green-400 hover:bg-green-900/20'
              }`}>
              {selectedPick === 'a' ? '✓ ' : ''}{question.option_a}
            </button>
            <button onClick={() => handlePick('b')} disabled={isPending || isOwner}
              className={`py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                selectedPick === 'b'
                  ? 'bg-red-600 border-red-500 text-white'
                  : 'bg-red-900/10 border-red-900/30 text-red-400 hover:bg-red-900/20'
              }`}>
              {selectedPick === 'b' ? '✓ ' : ''}{question.option_b}
            </button>
          </div>
          {isOwner && (
            <p className="text-xs text-gray-600 text-center">You can't bet on your own question</p>
          )}
          {selectedPick && !isOwner && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Wager</span>
                <input type="number" min={0} max={publicCoins} value={wager}
                  onChange={e => setWager(Math.min(parseInt(e.target.value) || 0, publicCoins))}
                  className="w-20 bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-green-600" />
                <span className="text-xs text-gray-500">🪙 of {publicCoins}</span>
                <button onClick={handleConfirm} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 ml-auto">
                  {isPending ? '...' : 'Confirm'}
                </button>
              </div>
              {wager > 0 && (
                <div className="bg-[#111] rounded-lg px-3 py-2 text-xs flex justify-between items-center">
                  <span className="text-gray-500">You put in <span className="text-white font-bold">{wager}🪙</span></span>
                  <span className="text-gray-600">→</span>
                  <span className="text-gray-500">Win <span className="text-green-400 font-bold">{userWouldWin}🪙</span> if correct</span>
                </div>
              )}
            </div>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}

      {/* User's pick result */}
      {userPick && (
        <div className={`rounded-xl px-4 py-3 text-sm text-center ${
          userPick.is_correct === true ? 'bg-green-900/20 border border-green-900/40 text-green-300' :
          userPick.is_correct === false ? 'bg-red-900/20 border border-red-900/40 text-red-300' :
          'bg-[#1a1a1a] text-gray-400'
        }`}>
          {userPick.is_correct === true && '✅ '}
          {userPick.is_correct === false && '❌ '}
          You picked <strong>{userPick.pick === 'a' ? question.option_a : question.option_b}</strong>
          {userPick.wager > 0 && <span className="ml-2 opacity-70">· {userPick.wager}🪙 wagered</span>}
          {userPick.payout != null && userPick.payout > 0 && (
            <span className="ml-2 font-bold text-green-400">+{userPick.payout}🪙</span>
          )}
        </div>
      )}

      {/* Owner controls */}
      {isOwner && (
        <div className="mt-3 border-t border-[#1f1f1f] pt-3 space-y-2">
          {!graded && locked && (
            <>
              {showGrade ? (
                <div className="flex gap-2">
                  <button onClick={() => handleGrade('a')} disabled={isPending}
                    className="flex-1 py-2 rounded-xl text-sm font-bold bg-green-900/20 border border-green-800/50 text-green-400 hover:bg-green-900/40">
                    ✓ {question.option_a}
                  </button>
                  <button onClick={() => handleGrade('b')} disabled={isPending}
                    className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/40">
                    ✓ {question.option_b}
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowGrade(true)} className="btn-primary text-xs w-full">
                  Grade This Question
                </button>
              )}
            </>
          )}
          <button onClick={handleDelete} disabled={isPending}
            className="w-full py-2 rounded-xl text-xs text-red-400 border border-red-900/30 hover:bg-red-900/20 transition-all">
            🗑️ Delete Question
          </button>
        </div>
      )}

      {graded && correctAnswer && (
        <p className="text-xs text-gray-600 mt-2 text-center">
          Correct answer: <strong>{correctAnswer === 'a' ? question.option_a : question.option_b}</strong>
        </p>
      )}
    </div>
  )
}
