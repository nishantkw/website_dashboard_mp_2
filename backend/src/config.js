import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const jwtSecret = process.env.JWT_SECRET || 'dev-secret'
const weakSecrets = new Set(['dev-secret', 'change-me-in-production', 'secret', 'jwt-secret'])

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret,
  jwtSecretIsWeak: weakSecrets.has(jwtSecret) || jwtSecret.length < 32,
  jwtTtlSeconds: Number(process.env.JWT_TTL_SECONDS || 8 * 60 * 60),
  cookieName: process.env.AUTH_COOKIE_NAME || 'pmjay_session',
  cookieSecure: process.env.COOKIE_SECURE
    ? process.env.COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
  cookieSameSite: (process.env.COOKIE_SAMESITE || 'lax').toLowerCase(),
  dbPrimary: (process.env.DB_PRIMARY || 'postgres').toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseDbUrl: process.env.SUPABASE_DB_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

export function isAllowedCorsOrigin(origin) {
  if (!origin) return true
  const listed = String(config.corsOrigin)
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean)
  if (listed.includes(origin)) return true
  try {
    const host = new URL(origin).hostname
    return host.endsWith('.vercel.app')
  } catch {
    return false
  }
}
