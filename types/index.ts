export type User = {
  id: string
  username: string
  status: 'pending' | 'approved' | 'denied'
  is_admin: boolean
  is_super_admin: boolean
}

export type League = {
  id: string
  name: string
  join_code: string
  join_mode: 'auto_join' | 'admin_approval'
  token_name: string
  token_symbol: string
  starting_tokens: number
  distribution_mode: 'manual' | 'daily' | 'weekly'
  distribution_amount: number
  created_by: string
  created_at: string
}

export type LeagueMember = {
  id: string
  league_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  status: 'approved' | 'pending'
  tokens: number
}

export type Question = {
  id: string
  league_id: string
  question: string
  option_a: string
  option_b: string
  pick_type: 'fixed' | 'pool'
  correct_answer: 'a' | 'b' | null
  status: 'open' | 'closed' | 'graded'
  closes_at: string
  created_at: string
}

export type Pick = {
  id: string
  league_id: string
  question_id: string
  user_id: string
  pick: 'a' | 'b'
  wager: number
  is_correct: boolean | null
  payout: number | null
}

export type Parlay = {
  id: string
  league_id: string
  user_id: string
  wager: number
  legs_count: number
  multiplier: number
  status: 'pending' | 'won' | 'lost'
  payout: number | null
}

export type Message = {
  id: string
  league_id: string
  user_id: string
  text: string
  deleted: boolean
  created_at: string
}
