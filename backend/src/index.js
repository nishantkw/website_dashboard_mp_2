import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config, isAllowedCorsOrigin } from './config.js'
import { healthCheck, closePools } from './db/pool.js'
import { seedDashboardUsersIfEmpty } from './db/seedUsers.js'
import { requireAuth, requireRole, ROLES } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import claimsRoutes from './routes/claims.js'
import beneficiariesRoutes from './routes/beneficiaries.js'
import hospitalsRoutes from './routes/hospitals.js'
import fraudRoutes from './routes/fraud.js'
import patientsRoutes from './routes/patients.js'
import lmsRoutes from './routes/lms.js'
import workflowRoutes from './routes/workflow.js'
import umpRoutes from './routes/ump.js'
import bisRoutes from './routes/bis.js'
import overviewRoutes from './routes/overview.js'
import importRoutes from './routes/import.js'
import schemaRoutes from './routes/schema.js'

const app = express()
app.set('trust proxy', 1)
app.disable('x-powered-by')

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: config.nodeEnv === 'production',
  })
)
app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedCorsOrigin(origin)) return callback(null, true)
      return callback(null, false)
    },
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json({ limit: '40mb' }))
app.use(express.urlencoded({ extended: true, limit: '40mb' }))

app.get('/api/health', async (_req, res) => {
  try {
    const db = await healthCheck()
    const anyOk = Object.values(db.backends).some((b) => b.ok)
    res.status(anyOk ? 200 : 503).json({
      ok: anyOk,
      service: 'pmjay-dashboard-api',
      ...db,
    })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message })
  }
})

app.use('/api/auth', authRoutes)
app.use('/api/bis', requireAuth, requireRole(ROLES.bis), bisRoutes)
app.use('/api/overview', requireAuth, requireRole(ROLES.admin), overviewRoutes)
app.use('/api/claims', requireAuth, requireRole(ROLES.mp), claimsRoutes)
app.use('/api/beneficiaries', requireAuth, requireRole(ROLES.mp), beneficiariesRoutes)
app.use('/api/hospitals', requireAuth, requireRole(ROLES.mp), hospitalsRoutes)
app.use('/api/fraud', requireAuth, requireRole(ROLES.mp), fraudRoutes)
app.use('/api/patients', requireAuth, requireRole(ROLES.mp), patientsRoutes)
app.use('/api/lms', requireAuth, requireRole(ROLES.mp), lmsRoutes)
app.use('/api/workflow', requireAuth, requireRole(ROLES.mp), workflowRoutes)
app.use('/api/ump', requireAuth, requireRole(ROLES.ump), umpRoutes)
app.use('/api/import', requireAuth, requireRole(ROLES.import), importRoutes)
app.use('/api/schema', requireAuth, schemaRoutes)

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid request' })
  }
  console.error('[api]', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

let server = null

function startListening(attempt = 1) {
  const maxAttempts = 12
  const s = app.listen(config.port, () => {
    server = s
    console.log(`API listening on http://localhost:${config.port}`)
    console.log(`DB primary preference: ${config.dbPrimary}`)
    console.log(`Postgres URL set: ${Boolean(config.databaseUrl)}`)
    console.log(`Supabase DB URL set: ${Boolean(config.supabaseDbUrl)}`)
  })
  s.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && attempt < maxAttempts) {
      console.warn(
        `[api] port ${config.port} already in use, retry ${attempt}/${maxAttempts} in 400ms`
      )
      setTimeout(() => startListening(attempt + 1), 400)
      return
    }
    console.error('[api] failed to listen:', err.message)
    process.exit(1)
  })
}

async function main() {
  if (config.nodeEnv === 'production' && config.jwtSecretIsWeak) {
    console.error('[auth] Set JWT_SECRET to a long random value before running in production.')
    process.exit(1)
  }
  if (config.jwtSecretIsWeak) {
    console.warn('[auth] JWT_SECRET is weak. Generate one with: openssl rand -base64 48')
  }

  try {
    await seedDashboardUsersIfEmpty()
  } catch (err) {
    console.warn('[auth] could not ensure login users:', err.message)
  }

  startListening()
}

main()

async function shutdown() {
  if (server) server.close()
  await closePools()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)