import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, closePools } from '../src/db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '../sql/012_m_nafu_safu_source.sql')

try {
  await query(fs.readFileSync(sqlPath, 'utf8'))
  const check = await query(
    `SELECT
       to_regclass('dmart_mp.m_nafu_safu_source')::text AS table_exists,
       (
         SELECT count(*)::int
         FROM information_schema.columns
         WHERE table_schema = 'dmart_mp' AND table_name = 'm_nafu_safu_source'
       ) AS column_count`
  )
  console.log(JSON.stringify(check.rows[0], null, 2))
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
} finally {
  await closePools()
}
