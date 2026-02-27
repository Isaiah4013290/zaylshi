'use client'

import { useState } from 'react'
import { PublicQuestionCard } from './PublicQuestionCard'
import { CreateQuestionModal } from './CreateQuestionModal'
import { VerifyPhoneModal } from './VerifyPhoneModal'
import { PublicChat } from './PublicChat'
import Link from 'next/link'

interface Props {
  questions: any[]
  picksByQuestion: Record<string, any>
  user: any
  phoneVerified: boolean
  publicCoins: number
}

export function PublicFeed({ questions, picksByQuestion, user, phoneVerified, publicCoins }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [showVerify, setShowVerify] = useState(false)
  const [localQuestions, setLocalQuestions] = useState(questions)
  const [localPicks, setLocalPicks] = useState(picksByQuestion)
  const [localCoins, setLocalCoins] = useState(publicCoins)
  const [isVerified, setIsVerified] = useState(phoneVerified)

  const handlePickMade = (questionId: string, pick: any, newCoins: number) => {
    setLocalPicks(prev => ({ ...prev, [questionId]: pick }))
    setLocalCoins(newCoins)
  }

  const handleQuestionCreated = (question: any) => {
    setLocalQuestions(prev => [question, ...prev])
    setShowCreate(false)
  }

  const handleVerified = () => {
    setIsVerified(true)
    setLocalCoins(100)
    setShowVerify(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne text-3xl font-bold">Public Feed</h1>
          <p className="text-gray-500 text-sm mt-1">Community predictions — most voted first</p>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Your coins</p>
              <p className="text-green-400 font-bold">🪙 {localCoins}</p>
            </div>
          )}
          <Link href="/public/leaderboard" className="btn-ghost text-sm">🏆 Board</Link>
          {user ? (
            isVerified ? (
              <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
                + Post
              </button>
            ) : (
              <button onClick={() => setShowVerify(true)} className="btn-primary text-sm">
                Verify Phone
              </button>
            )
          ) : (
            <Link href="/login" className="btn-primary text-sm">Login to Play</Link>
          )}
        </div>
      </div>

      {!user && (
        <div className="card p-4 mb-6 text-center text-sm text-gray-500">
          <Link href="/login" className="text-green-400 hover:text-green-300">Login</Link> or{' '}
          <Link href="/join" className="text-green-400 hover:text-green-300">sign up</Link> to bet and post questions
        </div>
      )}

      {user && !isVerified && (
        <div className="card p-4 mb-6 flex items-center justify-between">
          <p className="text-sm text-amber-400">⚠️ Verify your phone to bet and post questions</p>
          <button onClick={() => setShowVerify(true)} className="btn-primary text-xs px-3 py-1.5">
            Verify Now
          </button>
        </div>
      )}

      {localQuestions.length === 0 ? (
        <div className="text-center py-24 card">
          <div className="text-5xl mb-4">🤔</div>
          <p className="font-syne text-lg font-bold">No questions yet</p>
          <p className="text-sm text-gray-500 mt-1">Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {localQuestions.map(q => (
            <PublicQuestionCard
              key={q.id}
              question={q}
              userPick={localPicks[q.id] ?? null}
              user={user}
              phoneVerified={isVerified}
              publicCoins={localCoins}
              onPickMade={handlePickMade}
              onVerifyNeeded={() => setShowVerify(true)}
            />
          ))}
        </div>
      )}

      <PublicChat user={user} />

      {showCreate && (
        <CreateQuestionModal
          onClose={() => setShowCreate(false)}
          onCreated={handleQuestionCreated}
        />
      )}

      {showVerify && (
        <VerifyPhoneModal
          onClose={() => setShowVerify(false)}
          onVerified={handleVerified}
        />
      )}
    </div>
  )
}
