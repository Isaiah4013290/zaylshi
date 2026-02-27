'use client'

import { useState, useTransition } from 'react'

interface Props {
  onClose: () => void
  onVerified: () => void
}

export function VerifyPhoneModal({ onClose, onVerified }: Props) {
  const [isPending, startTransition] = useTransition()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [bypassCode, setBypassCode] = useState('')
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [error, setError] = useState('')

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose: 'phone_verify' }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      if (data.bypass) setBypassCode(data.code)
      setStep('code')
    })
  }

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      onVerified()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
      <div className="card p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-syne font-bold text-xl">Verify Phone</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">✕</button>
        </div>

        {step === 'phone' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <p className="text-sm text-gray-400">Enter your phone number to get a verification code</p>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="input-field" placeholder="+1234567890" required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Sending...' : 'Send Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-sm text-gray-400">Enter the 6-digit code sent to {phone}</p>
            {bypassCode && (
              <div className="bg-amber-900/20 border border-amber-900/40 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-400 mb-1">Dev mode — your code is:</p>
                <p className="font-mono font-bold text-2xl text-amber-300 tracking-widest">{bypassCode}</p>
              </div>
            )}
            <input type="text" value={code} onChange={e => setCode(e.target.value)}
              className="input-field text-center tracking-widest text-xl" placeholder="000000"
              maxLength={6} required />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'Verifying...' : 'Verify'}
            </button>
            <button type="button" onClick={() => setStep('phone')} className="btn-ghost w-full text-sm">
              ← Change number
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
