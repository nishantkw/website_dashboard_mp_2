import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, closePools } from '../src/db/pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '../sql/011_doctor_details.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

try {
  await query(sql)
  const check = await query(
    `SELECT
       to_regclass('dmart_mp.doctor_details_with_registartionandcaseid')::text AS table_exists,
       (
         SELECT count(*)::int
         FROM information_schema.columns
         WHERE table_schema = 'dmart_mp'
           AND table_name = 'doctor_details_with_registartionandcaseid'
       ) AS column_count`
  )
  console.log(JSON.stringify(check.rows[0], null, 2))
} catch (err) {
  console.error(err.message)
  process.exitCode = 1
} finally {
  await closePools()
}
