'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  leagueId: string
  league: any
  questions: any[]
  pendingMembers: any[]
  approvedMembers: any[]
  isSuperAdmin: boolean
}

export function AdminActions({ leagueId, league, questions, pendingMembers, approvedMembers, isSuperAdmin }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'questions' | 'create' | 'members' | 'tokens' | 'settings'>('questions')
  const [msg, setMsg] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [optionA, setOptionA] = useState('YES')
  const [optionB, setOptionB] = useState('NO')
  const [pickType, setPickType] = useState<'fixed' | 'pool'>('fixed')
  const [closeDate, setCloseDate] = useState('')
  const [closeTime, setCloseTime] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [giveUserId, setGiveUserId] = useState('')
  const [giveAmount, setGiveAmount] = useState(0)
  const [bio, setBio] = useState(league?.bio ?? '')
  const [copied, setCopied] = useState(false)

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const copyCode = () => {
    navigator.clipboard.writeText(league?.join_code ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const createQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    const closes_at = new Date(`${closeDate}T${closeTime}`).toISOString()
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, option_a: optionA, option_b: optionB, pick_type: pickType, closes_at }),
      })
      if (res.ok) { flash('✅ Question created!'); setQuestionText(''); setCloseDate(''); setCloseTime(''); router.refresh() }
      else flash('❌ Error')
    })
  }

  const gradeQuestion = async (questionId: string, answer: 'a' | 'b') => {
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/questions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, correct_answer: answer }),
      })
      if (res.ok) { flash('✅ Graded!'); router.refresh() }
      else flash('❌ Error')
    })
  }

  const deleteQuestion = async (questionId: string) => {
    if (!isSuperAdmin) { flash('❌ Only super admin can delete'); return }
    if (!confirm('Delete this question?')) return
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/questions`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
      if (res.ok) { flash('🗑️ Deleted!'); router.refresh() }
      else flash('❌ Error')
    })
  }

  const saveEdit = async (questionId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/questions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, question: editText }),
      })
      if (res.ok) { flash('✅ Updated!'); setEditingId(null); router.refresh() }
      else flash('❌ Error')
    })
  }

  const approveMember = async (userId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: userId, action: 'approve' }),
      })
      if (res.ok) { flash('✅ Approved!'); router.refresh() }
      else {
        const data = await res.json()
        flash(`❌ ${data.error ?? 'Error'}`)
      }
    })
  }

  const denyMember = async (userId: string) => {
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/members`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: userId, action: 'deny' }),
      })
      if (res.ok) { flash('Denied.'); router.refresh() }
      else flash('❌ Error')
    })
  }

  const giveTokens = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: giveUserId, amount: giveAmount }),
      })
      if (res.ok) { flash(`✅ Gave ${giveAmount} tokens!`); setGiveAmount(0); router.refresh() }
      else flash('❌ Error')
    })
  }

  const saveBio = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await fetch(`/api/leagues/${leagueId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })
      if (res.ok) flash('✅ Bio saved!')
      else flash('❌ Error saving bio')
    })
  }

  const tabs = [
    { key: 'questions', label: 'Questions' },
    { key: 'create', label: '+ Create' },
    { key: 'members', label: `Members${pendingMembers.length > 0 ? ` (${pendingMembers.length})` : ''}` },
    { key: 'tokens', label: 'Tokens' },
    { key: 'settings', label: '⚙️ Bio' },
  ] as const

  return (
    <div>
      <h2 className="font-syne text-2xl font-bold mb-4">Admin Panel</h2>

      <div className="bg-green-900/20 border border-green-900/40 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">League Join Code</p>
          <p className="font-mono font-bold text-2xl text-green-400 tracking-widest">{league?.join_code}</p>
        </div>
        <button onClick={copyCode} className="btn-ghost text-sm px-4 py-2">
          {copied ? '✅ Copied!' : 'Copy'}
        </button>
      </div>

      {msg && <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#1a1a1a] text-sm">{msg}</div>}

      <div className="flex gap-2 mb-6 border-b border-[#1f1f1f] pb-4 flex-wrap">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`text-sm px-4 py-2 rounded-xl transition-colors ${
              activeTab === t.key ? 'bg-green-600 text-white font-semibold' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' && (
        <div className="max-w-lg">
          <form onSubmit={createQuestion} className="card p-6 space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Question</label>
              <textarea value={questionText} onChange={e => setQuestionText(e.target.value)}
                className="input-field resize-none" rows={3} placeholder="Will Freeman win on Friday?" required />
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
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Pick Type</label>
              <select value={pickType} onChange={e => setPickType(e.target.value as any)} className="input-field">
                <option value="fixed">Fixed (2x payout)</option>
                <option value="pool">Pool (split losers tokens)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Close Date</label>
                <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} className="input-field" required />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Close Time</label>
                <input type="time" value={closeTime} onChange={e => setCloseTime(e.target.value)} className="input-field" required />
              </div>
            </div>
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Creating...' : 'Create Question'}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'questions' && (
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="text-center py-16 text-gray-600 card">No questions yet</div>
          ) : questions.map(q => (
            <div key={q.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                {editingId === q.id ? (
                  <div className="flex-1 space-y-2">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)}
                      className="input-field resize-none border-green-600" rows={2} />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(q.id)} disabled={isPending} className="btn-primary text-xs px-3 py-1.5">Save</button>
                      <button onClick={() => setEditingId(null)} className="btn-ghost text-xs px-3 py-1.5">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="font-semibold flex-1">{q.question}</p>
                )}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    q.status === 'graded' ? 'bg-[#1f1f1f] text-gray-400' :
                    new Date(q.closes_at) <= new Date() ? 'bg-red-900/30 text-red-400' :
                    'bg-green-900/30 text-green-400'
                  }`}>
                    {q.status === 'graded' ? `✓ ${q.correct_answer?.toUpperCase()}` :
                     new Date(q.closes_at) <= new Date() ? 'Closed' : 'Open'}
                  </span>
                  {editingId !== q.id && (
                    <button onClick={() => { setEditingId(q.id); setEditText(q.question) }}
                      className="text-xs px-2 py-1 rounded-lg bg-[#1f1f1f] text-gray-400 hover:bg-[#2a2a2a]">✏️</button>
                  )}
                  {isSuperAdmin && (
                    <button onClick={() => deleteQuestion(q.id)} disabled={isPending}
                      className="text-xs px-2 py-1 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50">🗑️</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                {q.option_a} vs {q.option_b} · Closes {new Date(q.closes_at).toLocaleString()}
              </p>
              {q.status !== 'graded' && (
                <div className="flex gap-2">
                  <button onClick={() => gradeQuestion(q.id, 'a')} disabled={isPending}
                    className="flex-1 py-2 rounded-xl font-bold text-sm bg-green-900/20 border border-green-800/50 text-green-400 hover:bg-green-900/40">
                    ✓ {q.option_a}
                  </button>
                  <button onClick={() => gradeQuestion(q.id, 'b')} disabled={isPending}
                    className="flex-1 py-2 rounded-xl font-bold text-sm bg-red-900/20 border border-red-800/50 text-red-400 hover:bg-red-900/40">
                    ✓ {q.option_b}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-6">
          {pendingMembers.length > 0 && (
            <div>
              <h3 className="font-syne font-bold text-lg mb-3 text-green-400">Pending</h3>
              <div className="space-y-2">
                {pendingMembers.map(m => (
                  <div key={m.user_id} className="card p-4 flex items-center justify-between">
                    <p className="font-medium">@{m.users?.username}</p>
                    <div className="flex gap-2">
                      <button onClick={() => approveMember(m.user_id)} disabled={isPending} className="btn-primary text-xs px-3 py-1.5">Approve</button>
                      <button onClick={() => denyMember(m.user_id)} disabled={isPending} className="btn-danger text-xs px-3 py-1.5">Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="font-syne font-bold text-lg mb-3">All Members</h3>
            <div className="card overflow-hidden">
              {approvedMembers.map(m => (
                <div key={m.user_id} className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]/40">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">@{m.users?.username}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      m.role === 'owner' ? 'bg-green-900/40 text-green-400' :
                      m.role === 'admin' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-[#1f1f1f] text-gray-500'
                    }`}>{m.role}</span>
                  </div>
                  <span className="text-green-500 font-bold text-sm">{m.tokens}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <h3 className="font-syne font-bold text-lg mb-4">Give Tokens</h3>
            <form onSubmit={giveTokens} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Member</label>
                <select value={giveUserId} onChange={e => setGiveUserId(e.target.value)} className="input-field" required>
                  <option value="">Select member...</option>
                  {approvedMembers.map(m => (
                    <option key={m.user_id} value={m.user_id}>@{m.users?.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">Amount</label>
                <input type="number" value={giveAmount} onChange={e => setGiveAmount(parseInt(e.target.value))}
                  className="input-field" min={1} required />
              </div>
              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? 'Sending...' : 'Give Tokens'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-lg">
          <div className="card p-6">
            <h3 className="font-syne font-bold text-lg mb-4">League Bio</h3>
            <form onSubmit={saveBio} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1.5">
                  Bio <span className="text-gray-600">(shown on picks page)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="input-field resize-none w-full"
                  rows={4}
                  placeholder="Welcome to our league! May the best picker win..."
                  maxLength={500}
                />
                <p className="text-xs text-gray-600 mt-1">{bio.length}/500</p>
              </div>
              <button type="submit" disabled={isPending} className="btn-primary w-full">
                {isPending ? 'Saving...' : 'Save Bio'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
