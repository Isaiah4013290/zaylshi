'use client'

import { useState, useTransition } from 'react'

interface Props {
  onClose: () => void
  onCreated: (question: any) => void
}

export function CreateQuestionModal({ onClose, onCreated }: Props) {
  const [isPending, startTransition] = useTransition()
  const [question, setQuestion] = useState('')
  const [optionA, setOptionA] = useState('YES')
  const [optionB, setOptionB] = useState('NO')
  const [closeDate, setCloseDate] = useState('')
  const [closeTime, setCloseTime] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const closes_at = new Date(`${closeDate}T${closeTime}`).toISOString()
      const res = await fetch('/api/public/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, option_a: optionA, option_b: optionB, closes_at }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onCreated({
        id: data.id,
        question,
        option_a: optionA,
        option_b: optionB,
        closes_at,
        status: 'open',
        unique_voters: 0,
        unique_voters_a: 0,
        unique_voters_b: 0,
        total_coins: 0,
        users: { username: 'you' }
      })
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="card p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-bold text-xl">Post a Question</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-1.5">Question</label>
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              className="input-field resize-none" rows={3}
              placeholder="Will the Lakers win tonight?" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Option A</label>
              <input value={optionA} onChange={e => setOptionA(e.target.value)} className="input-field" required />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Option B</label>
              <input value={optionB} onChange={e => setOptionB(e.target.value)} className="input-field" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Close Date</label>
              <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)}
                className="input-field" required />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Close Time</label>
              <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)}
                className="input-field" required />
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={isPending} className="btn-primary w-full">
            {isPending ? 'Posting...' : 'Post Question'}
          </button>
        </form>
      </div>
    </div>
  )
}
