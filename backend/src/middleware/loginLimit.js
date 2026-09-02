import rateLimit from 'express-rate-limit'
import bcrypt from 'bcryptjs'

const WINDOW_MS = 15 * 60 * 1000
const LOCK_AFTER = 5
const attempts = new Map()

/** Valid bcrypt hash used only so failed lookups take about as long as real ones. */
export const DUMMY_PASSWORD_HASH = bcrypt.hashSync('timing-pad-not-a-user', 10)

export const loginRateLimit = rateLimit({
  windowMs: WINDOW_MS,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

function keyFor(username) {
  return String(username || '').trim().toLowerCase()
}

export function isUsernameLocked(username) {
  const rec = attempts.get(keyFor(username))
  if (!rec?.lockedUntil) return false
  if (Date.now() < rec.lockedUntil) return true
  attempts.delete(keyFor(username))
  return false
}

export function recordLoginFailure(username) {
  const key = keyFor(username)
  if (!key) return
  const rec = attempts.get(key) || { count: 0, lockedUntil: 0 }
  rec.count += 1
  if (rec.count >= LOCK_AFTER) rec.lockedUntil = Date.now() + WINDOW_MS
  attempts.set(key, rec)
}

export function recordLoginSuccess(username) {
  attempts.delete(keyFor(username))
}