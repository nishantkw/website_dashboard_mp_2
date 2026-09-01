import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

export const config = {
  port: Number(process.env.PORT || 4000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  dbPrimary: (process.env.DB_PRIMARY || 'postgres').toLowerCase(),
  databaseUrl: process.env.DATABASE_URL || '',
  supabaseDbUrl: process.env.SUPABASE_DB_URL || '',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}
