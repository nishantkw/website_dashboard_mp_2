import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { healthCheck, closePools } from './db/pool.js'
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

app.use(cors({ origin: config.corsOrigin, credentials: true }))
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
app.use('/api/bis', bisRoutes)
app.use('/api/overview', overviewRoutes)
app.use('/api/claims', claimsRoutes)
app.use('/api/beneficiaries', beneficiariesRoutes)
app.use('/api/hospitals', hospitalsRoutes)
app.use('/api/fraud', fraudRoutes)
app.use('/api/patients', patientsRoutes)
app.use('/api/lms', lmsRoutes)
app.use('/api/workflow', workflowRoutes)
app.use('/api/ump', umpRoutes)
app.use('/api/import', importRoutes)
app.use('/api/schema', schemaRoutes)

app.use((err, _req, res, _next) => {
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

startListening()

async function shutdown() {
  if (server) server.close()
  await closePools()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
