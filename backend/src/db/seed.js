import { query, closePools } from './pool.js'

const SKIP = new Set(['app_auth.dashboard_users'])

/**
 * Removes all rows from business tables. Login users are kept.
 */
async function clearData() {
  console.log('Clearing all business rows (schema + login users kept)...')

  const { rows } = await query(`
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN ('bis_raw', 'dmart_mp', 'ump_raw', 'app_auth')
      AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
  `)

  const targets = rows.filter((r) => !SKIP.has(`${r.table_schema}.${r.table_name}`))
  if (!targets.length) {
    console.log('No tables found to clear.')
    await closePools()
    return
  }

  const list = targets.map((r) => `${r.table_schema}.${r.table_name}`).join(', ')
  try {
    await query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`)
    for (const r of targets) {
      console.log(`  cleared ${r.table_schema}.${r.table_name}`)
    }
  } catch (err) {
    console.warn(`  bulk truncate failed (${err.message}); clearing one by one`)
    for (const r of targets) {
      const id = `${r.table_schema}.${r.table_name}`
      try {
        await query(`TRUNCATE TABLE ${id} RESTART IDENTITY CASCADE`)
        console.log(`  cleared ${id}`)
      } catch (oneErr) {
        try {
          await query(`DELETE FROM ${id}`)
          console.log(`  deleted ${id}`)
        } catch (delErr) {
          console.warn(`  skip ${id}: ${delErr.message}`)
        }
      }
    }
  }

  console.log('Done. Database is empty and ready for import.')
  await closePools()
}

clearData().catch(async (err) => {
  console.error('Clear failed:', err.message)
  await closePools()
  process.exit(1)
})
