import { cookies } from 'next/headers'
import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string) {
  const cookieStore = await cookies()
  cookieStore.set('session_user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
}

export async function getSessionUser() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('session_user_id')?.value
  if (!userId) return null

  const { data } = await supabase
    .from('users')
    .select('id, username, status, is_admin, is_super_admin')
    .eq('id', userId)
    .maybeSingle()

  if (!data || data.status !== 'approved') return null
  return data
}

export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session_user_id')
}
