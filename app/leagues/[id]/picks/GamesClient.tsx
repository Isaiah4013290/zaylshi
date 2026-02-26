'use client'
import { useState } from 'react'
import { PickCard } from './PickCard'
import { ParlayTray, ParlayLeg } from './ParlayTray'

interface Props {
  leagueId: string
  user: any
  open: any[]
  closed: any[]
  picksByQuestion: Record<string, any>
  tokens: number
  tokenName: string
  tokenSymbol: string
  bio: string
}

export function GamesClient({ leagueId, user, open, closed, picksByQuestion, tokens, tokenName, tokenSymbol, bio }: Props) {
  const [parlayLegs, setParlayLegs] = useState<ParlayLeg[]>([])

  const addToParlay = (leg: ParlayLeg) => {
    setParlayLegs(prev => {
      const exists = prev.find(l => l.questionId === leg.questionId)
      if (exists) return prev.map(l => l.questionId === leg.questionId ? leg : l)
      if (prev.length >= 6) return prev
      return [...prev, leg]
    })
  }

  const removeFromParlay = (questionId: string) => {
    setParlayLegs(prev => prev.filter(l => l.questionId !== questionId))
  }

  return (
    <div className="pb-40">
      {bio && (
        <div className="card p-4 mb-6 text-sm text-gray-300 border border-[#1f1f1f]">
          {bio}
        </div>
      )}
      <div className="mb-6">
        <p className="text-gray-500 text-sm">
          You have <span className="text-green-400 font-semibold">{tokens} {tokenSymbol} {tokenName}</span> to wager
        </p>
      </div>
      {open.length === 0 && closed.length === 0 ? (
        <div className="text-center py-24 card">
          <div className="text-5xl mb-4">🤔</div>
          <p className="font-syne text-lg font-bold">No questions yet</p>
          <p className="text-sm text-gray-500 mt-1">Check back soon</p>
        </div>
      ) : (
        <div className="space-y-10">
          {open.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-green-400 mb-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#1f1f1f]" />
                Open for picks
                <span className="h-px flex-1 bg-[#1f1f1f]" />
              </h2>
              <div className="space-y-4">
                {open.map(q => (
                  <PickCard key={q.id} question={q} userPick={picksByQuestion[q.id] ?? null}
                    tokens={tokens} tokenSymbol={tokenSymbol} leagueId={leagueId}
                    parlayLegs={parlayLegs} onAddToParlay={addToParlay} onRemoveFromParlay={removeFromParlay} />
                ))}
              </div>
            </section>
          )}
          {closed.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-gray-600 mb-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#1f1f1f]" />
                Closed
                <span className="h-px flex-1 bg-[#1f1f1f]" />
              </h2>
              <div className="space-y-4">
                {closed.map(q => (
                  <PickCard key={q.id} question={q} userPick={picksByQuestion[q.id] ?? null}
                    tokens={tokens} tokenSymbol={tokenSymbol} leagueId={leagueId}
                    parlayLegs={parlayLegs} onAddToParlay={addToParlay} onRemoveFromParlay={removeFromParlay} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
      <ParlayTray legs={parlayLegs} tokens={tokens} tokenSymbol={tokenSymbol}
        leagueId={leagueId} onRemoveLeg={removeFromParlay} onClear={() => setParlayLegs([])} />
    </div>
  )
}
