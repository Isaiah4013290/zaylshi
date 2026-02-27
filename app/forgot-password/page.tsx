'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<'username' | 'code' | 'password'>('username')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [bypassCode, setBypassCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const requestReset = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, step: 'request' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setPhone(data.phone)
      if (data.bypass) setBypassCode(data.code)
      setStep('code')
    })
  }

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setStep('password')
  }

  const resetPassword = (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirm) { setError('Passwords do not match'); return }
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, code, newPassword, step: 'reset' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    })
  }

  if (success) return (
    <div className="max-w-sm mx-auto pt-16 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="font-syne text-2xl font-bold mb-2">Password Reset!</h1>
      <p className="text-gray-500 text-sm">Redirecting to login...</p>
    </div>
  )

  return (
    <div className="max-w-sm mx-auto pt-16">
      <div className="text-center mb-8">
        <h1 className="font-syne text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-500 text-sm">We'll send a code to your verified phone</p>
      </div>
      <div className="card p-6">
        {step === 'username' && (
          <form onSubmit={requestReset} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Username</label>
              <input value={username} onChange={e => setUsername(e.target.value)}
                className="input-field" placeholder="your username" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Sending...' : 'Send Reset Code'}
            </button>
            <p className="text-center text-sm text-gray-600">
              <Link href="/login" className="text-green-400 hover:text-green-300">← Back to login</Link>
            </p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-sm text-gray-400 text-center">Code sent to your phone</p>
            {bypassCode && (
              <div className="bg-amber-900/20 border border-amber-900/40 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-400 mb-1">Dev mode — your code is:</p>
                <p className="font-mono font-bold text-2xl text-amber-300 tracking-widest">{bypassCode}</p>
              </div>
            )}
            <input type="text" value={code} onChange={e => setCode(e.target.value)}
              className="input-field text-center tracking-widest text-xl"
              placeholder="000000" maxLength={6} required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              Continue
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={resetPassword} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                className="input-field" required />
            </div>
            <div>
              <label className="text-sm text-gray-400 block mb-1.5">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="input-field" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
