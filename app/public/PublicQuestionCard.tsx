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

  const totalPot = coinsA + coinsB

  const potentialWinA = wager > 0
    ? Math.floor(wager + (wager / (coinsA + wager)) * coinsB)
    : 0
  const potentialWinB = wager > 0
    ? Math.floor(wager + (wager / (coinsB + wager)) * coinsA)
    : 0
  const potentialWin = selectedPick === 'a' ? potentialWinA : selectedPick === 'b' ? potentialWinB : 0
  const potentialProfit = potentialWin - wager

  const pctA = totalVoters > 0 ? Math.round((votersA / totalVoters) * 100) : 50
  const pctB = 100 - pctA

  const isOwner = user?.id === question.created_by
  const locked = new Date(question.closes_at) <= new Date()

  const handlePick = (pick: 'a' | 'b') => {
    if (!user) return
    if (!phoneVerified) { onVerifyNeeded(); return }
    setSelectedPick(pick)
  }

  const handleConfirm = () => {
    if (!selectedPick) { setError('Select an option first'); return }
    if (wager <= 0) { setError('Enter a wager amount'); return }
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
      <div className="flex items-start justify-between gap-3 mb-4">
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

      {/* Pool display */}
      <div className="mb-4">
        <div className="h-3 rounded-full bg-[#1f1f1f] overflow-hidden flex mb-3">
          <div className="bg-green-500 h-full transition-all rounded-l-full" style={{ width: `${pctA}%` }} />
          <div className="bg-red-500 h-full transition-all rounded-r-full" style={{ width: `${pctB}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] rounded-xl p-3 border border-green-900/20">
            <div className="flex justify-between items-center mb-1">
              <span className="text-green-400 font-bold text-sm">{question.option_a}</span>
              <span className="text-green-400 font-bold">{pctA}%</span>
            </div>
            <p className="text-xs text-gray-500">{coinsA}🪙 wagered</p>
            <p className="text-xs text-gray-600">{votersA} voters</p>
          </div>
          <div className="bg-[#111] rounded-xl p-3 border border-red-900/20">
            <div className="flex justify-between items-center mb-1">
              <span className="text-red-400 font-bold text-sm">{question.option_b}</span>
              <span className="text-red-400 font-bold">{pctB}%</span>
            </div>
            <p className="text-xs text-gray-500">{coinsB}🪙 wagered</p>
            <p className="text-xs text-gray-600">{votersB} voters</p>
          </div>
        </div>
        {totalPot > 0 && (
          <p className="text-center text-xs text-gray-600 mt-2">
            Total pot: <span className="text-white font-medium">{totalPot}🪙</span>
          </p>
        )}
      </div>

      {/* Pick + wager */}
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
                <input
                  type="number" min={1} max={publicCoins} value={wager}
                  onChange={e => setWager(Math.min(parseInt(e.target.value) || 0, publicCoins))}
                  className="w-20 bg-[#1a1a1a] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:border-green-600"
                />
                <span className="text-xs text-gray-500">🪙 of {publicCoins}</span>
                <button onClick={handleConfirm} disabled={isPending} className="btn-primary text-xs px-3 py-1.5 ml-auto">
                  {isPending ? '...' : 'Confirm'}
                </button>
              </div>

              {wager > 0 && (
                <div className="bg-[#111] rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-gray-500">
                    <span>Your wager</span>
                    <span className="text-white">{wager}🪙</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Your share of {selectedPick === 'a' ? question.option_a : question.option_b} side</span>
                    <span className="text-white">
                      {selectedPick === 'a'
                        ? `${Math.round((wager / (coinsA + wager)) * 100)}%`
                        : `${Math.round((wager / (coinsB + wager)) * 100)}%`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Potential winnings from losers</span>
                    <span className="text-green-400">+{potentialProfit}🪙</span>
                  </div>
                  <div className="border-t border-[#1f1f1f] pt-1.5 flex justify-between font-bold">
                    <span className="text-gray-300">Total payout if correct</span>
                    <span className="text-green-400">{potentialWin}🪙</span>
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <p className="text-red-400 text-xs">{error}</p>}
        </div>
      )}

      {/* Closed no pick */}
      {!graded && locked && !userPick && !isOwner && (
        <div className="rounded-xl px-4 py-3 text-sm text-center bg-[#1a1a1a] text-gray-600">
          Closed — no pick made
        </div>
      )}

      {/* User pick result */}
      {userPick && (
        <div className={`rounded-xl px-4 py-3 text-sm ${
          userPick.is_correct === true ? 'bg-green-900/20 border border-green-900/40 text-green-300' :
          userPick.is_correct === false ? 'bg-red-900/20 border border-red-900/40 text-red-300' :
          'bg-[#1a1a1a] text-gray-400'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <span>
              {userPick.is_correct === true && '✅ '}
              {userPick.is_correct === false && '❌ '}
              You picked <strong>{userPick.pick === 'a' ? question.option_a : question.option_b}</strong>
            </span>
            {userPick.payout != null && userPick.payout > 0 && (
              <span className="font-bold text-green-400">+{userPick.payout}🪙</span>
            )}
          </div>

          {/* Pending pick breakdown */}
          {(userPick.is_correct === null || userPick.is_correct === undefined) && (() => {
            const myWager = userPick.wager ?? 0
            const mySide = userPick.pick === 'a' ? coinsA : coinsB
            const otherSide = userPick.pick === 'a' ? coinsB : coinsA
            const myShare = mySide > 0 ? Math.round((myWager / mySide) * 100) : 100
            const potentialPayout = mySide > 0
              ? Math.floor(myWager + (myWager / mySide) * otherSide)
              : myWager
            const profit = potentialPayout - myWager

            return (
              <div className="space-y-1 text-xs border-t border-white/10 pt-2">
                <div className="flex justify-between text-gray-500">
                  <span>Your wager</span>
                  <span className="text-white">{myWager}🪙</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Your share of {userPick.pick === 'a' ? question.option_a : question.option_b} side</span>
                  <span className="text-white">{myShare}%</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Potential winnings from losers</span>
                  <span className="text-green-400">+{profit}🪙</span>
                </div>
                <div className="flex justify-between font-bold border-t border-white/10 pt-1">
                  <span className="text-gray-300">Payout if correct</span>
                  <span className="text-green-400">{potentialPayout}🪙</span>
                </div>
              </div>
            )
          })()}

          {/* Graded result */}
          {userPick.is_correct !== null && userPick.is_correct !== undefined && (
            <div className="flex justify-between mt-1 text-xs opacity-70">
              <span>Wagered {userPick.wager}🪙</span>
              {userPick.is_correct === false && <span>Lost {userPick.wager}🪙</span>}
              {userPick.is_correct === true && userPick.payout && (
                <span>Profit +{userPick.payout - userPick.wager}🪙</span>
              )}
            </div>
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
