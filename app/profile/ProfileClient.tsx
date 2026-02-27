'use client'

import { useState } from 'react'
import { VerifyPhoneModal } from '../public/VerifyPhoneModal'

export function ProfileClient({ user }: { user: any }) {
  const [showVerify, setShowVerify] = useState(false)
  const [isVerified, setIsVerified] = useState(user?.phone_verified ?? false)
  const [phone, setPhone] = useState(user?.phone ?? '')

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-syne text-3xl font-bold mb-8">Profile</h1>

      <div className="space-y-4">
        <div className="card p-6">
          <h2 className="font-syne font-bold text-lg mb-4">Account</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-[#1f1f1f]">
              <span className="text-gray-400 text-sm">Username</span>
              <span className="font-medium">@{user?.username}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[#1f1f1f]">
              <span className="text-gray-400 text-sm">Member since</span>
              <span className="text-sm">{new Date(user?.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-syne font-bold text-lg mb-4">Phone Verification</h2>
          {isVerified ? (
            <div className="flex items-center gap-3">
              <span className="text-green-400 text-xl">✅</span>
              <div>
                <p className="font-medium text-sm">Phone Verified</p>
                <p className="text-xs text-gray-500">{phone}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">Verify your phone to access the public feed and get daily coins</p>
              <button onClick={() => setShowVerify(true)} className="btn-primary w-full">
                Verify Phone Number
              </button>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-syne font-bold text-lg mb-4">Public Stats</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-400">{user?.public_coins ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Daily Coins Left</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{user?.lifetime_coins_earned ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Lifetime Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{user?.lifetime_coins_wagered ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Lifetime Wagered</p>
            </div>
          </div>
        </div>
      </div>

      {showVerify && (
        <VerifyPhoneModal
          onClose={() => setShowVerify(false)}
          onVerified={() => {
            setIsVerified(true)
            setShowVerify(false)
          }}
        />
      )}
    </div>
  )
}
