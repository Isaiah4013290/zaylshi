'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  text: string
  created_at: string
  deleted: boolean
  users: { username: string }
}

interface Props {
  leagueId: string
  currentUser: any
  initialMessages: Message[]
  isAdmin: boolean
}

export function ChatClient({ leagueId, currentUser, initialMessages, isAdmin }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    const res = await fetch(`/api/leagues/${leagueId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (res.ok) {
      const data = await res.json()
      setMessages(prev => [...prev, { ...data.message, users: { username: currentUser.username } }])
      setText('')
    }
    setLoading(false)
  }

  const deleteMessage = async (messageId: string) => {
    await fetch(`/api/leagues/${leagueId}/chat`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    })
    setMessages(prev => prev.filter(m => m.id !== messageId))
  }

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-600 text-sm">No messages yet — say something!</div>
        ) : messages.map(m => (
          <div key={m.id} className={`flex gap-2 items-start group ${m.users?.username === currentUser.username ? 'flex-row-reverse' : ''}`}>
            <div className="w-7 h-7 rounded-full bg-[#1f1f1f] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1">
              {m.users?.username?.[0]?.toUpperCase()}
            </div>
            <div className={`max-w-[75%] ${m.users?.username === currentUser.username ? 'items-end' : 'items-start'} flex flex-col`}>
              <span className="text-xs text-gray-600 mb-1">{m.users?.username}</span>
              <div className={`px-3 py-2 rounded-2xl text-sm ${
                m.users?.username === currentUser.username
                  ? 'bg-green-900/40 text-green-100'
                  : 'bg-[#1a1a1a] text-gray-200'
              }`}>
                {m.text}
              </div>
            </div>
            {isAdmin && m.users?.username !== currentUser.username && (
              <button onClick={() => deleteMessage(m.id)}
                className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:text-red-400 mt-2 transition-opacity">
                ✕
              </button>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <input value={text} onChange={e => setText(e.target.value)}
          placeholder="Say something..."
          className="input-field flex-1" />
        <button type="submit" disabled={loading || !text.trim()} className="btn-primary px-4">
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
