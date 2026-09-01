import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query, closePools } from './pool.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQL_DIR = path.join(__dirname, '../../sql')

async function migrate() {
  const files = [
    '001_init_schemas.sql',
    '002_dmart_mp_extended.sql',
    '003_import_uploads.sql',
    '004_unique_import_keys.sql',
    '005_widen_id_types.sql',
    '006_nullable_import_paths.sql',
    '007_beneficiary_dtl_hist.sql',
    '008_widen_pk_bigint.sql',
    '009_morth_patient_details.sql',
  ].filter((f) => fs.existsSync(path.join(SQL_DIR, f)))

  for (const file of files) {
    const sqlPath = path.join(SQL_DIR, file)
    const sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('Running migration:', sqlPath)
    await query(sql)
    console.log('  OK:', file)
  }

  console.log('Migration completed successfully.')
  await closePools()
}

migrate().catch(async (err) => {
  console.error('Migration failed:', err.message)
  await closePools()
  process.exit(1)
})
