import { query, closePools } from '../src/db/pool.js'

const r = await query(`SELECT preview->0 AS first FROM app_auth.import_uploads WHERE file_name = 'Result 8.csv' LIMIT 1`)
console.log(JSON.stringify(r.rows[0].first, null, 2))
await closePools()
