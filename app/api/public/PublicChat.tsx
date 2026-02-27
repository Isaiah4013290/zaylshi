'use client'

import { useState, useEffect, useRef, useTransition } from 'react'

interface Message {
  id: string
  message: string
  created_at: string
  users: { username: string }
}

interface Props {
  user: any
}

export function PublicChat({ user }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    const res = await fetch('/api/public/chat')
    const data = await res.json()
    setMessages((data.messages ?? []).reverse())
  }

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setInput('')
      fetchMessages()
    })
  }

  return (
    <div className="card mt-6">
      <div className="px-5 py-4 border-b border-[#1f1f1f]">
        <h2 className="font-syne font-bold text-lg">💬 Public Chat</h2>
        <p className="text-xs text-gray-500 mt-0.5">Talk trash, share picks, have fun</p>
      </div>

      {/* Messages */}
      <div className="h-72 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-600 text-sm pt-8">No messages yet — say something!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-900/40 border border-green-900/60 flex items-center justify-center flex-shrink-0 text-xs font-bold text-green-400">
              {msg.users?.username?.[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-green-400">@{msg.users?.username}</span>
                <span className="text-xs text-gray-600">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-300 mt-0.5">{msg.message}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1f1f1f]">
        {user ? (
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Say something..."
              maxLength={200}
              className="flex-1 bg-[#1a1a1a] border border-[#1f1f1f] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-600"
            />
            <button type="submit" disabled={isPending || !input.trim()} className="btn-primary text-sm px-4">
              {isPending ? '...' : 'Send'}
            </button>
          </form>
        ) : (
          <p className="text-center text-xs text-gray-600">
            <a href="/login" className="text-green-400 hover:text-green-300">Login</a> to chat
          </p>
        )}
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>
    </div>
  )
}
