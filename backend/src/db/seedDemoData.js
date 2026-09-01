import { query, closePools } from './pool.js'
import { getImportTables, assertSafeIdent } from '../utils/schemaRegistry.js'
import { generateDemoRows, getDemoSeedTables, DEMO_ROW_COUNT } from './demoDataGenerator.js'

async function getDbColumns(schema, table) {
  try {
    const { rows } = await query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, table]
    )
    return rows.map((r) => ({ name: r.column_name, type: r.data_type }))
  } catch {
    return null
  }
}

async function truncateTable(tableDef) {
  try {
    await query(`TRUNCATE TABLE ${tableDef.schema}.${tableDef.table} RESTART IDENTITY CASCADE`)
    return true
  } catch {
    try {
      await query(`DELETE FROM ${tableDef.schema}.${tableDef.table}`)
      return true
    } catch (err) {
      return err.message
    }
  }
}

async function insertRows(tableDef, rows) {
  let inserted = 0
  const errors = []

  for (let i = 0; i < rows.length; i++) {
    const mapped = { ...rows[i] }

    if (tableDef.autoGeneratePk && tableDef.primaryKey) {
      const pk = tableDef.primaryKey
      if (mapped[pk] === null || mapped[pk] === undefined || mapped[pk] === '') {
        delete mapped[pk]
      }
    }

    const cols = Object.keys(mapped).filter((c) => mapped[c] !== undefined && mapped[c] !== null)
    if (!cols.length) continue

    cols.forEach((c) => assertSafeIdent(c, 'column'))
    const params = cols.map((c) => mapped[c])
    const placeholders = cols.map((_, idx) => `$${idx + 1}`)

    try {
      await query(
        `INSERT INTO ${tableDef.schema}.${tableDef.table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`,
        params
      )
      inserted++
    } catch (err) {
      errors.push(`row ${i + 1}: ${err.message}`)
      if (errors.length >= 3) break
    }
  }

  return { inserted, errors }
}

async function seedDemoData() {
  const tables = getDemoSeedTables(getImportTables)
  console.log(`Seeding ${DEMO_ROW_COUNT} demo rows into ${tables.length} tables (excluding User Management / UMP)...`)

  let ok = 0
  let partial = 0
  let failed = 0

  for (const tableDef of tables) {
    process.stdout.write(`  ${tableDef.id} ... `)

    const dbCols = await getDbColumns(tableDef.schema, tableDef.table)
    if (!dbCols?.length) {
      console.log('skip (table not in database)')
      failed++
      continue
    }

    const hasIdPk = dbCols.some((c) => c.name === 'id_pk')
    const tableForGen = {
      ...tableDef,
      autoGeneratePk: tableDef.autoGeneratePk && !hasIdPk,
    }

    const trunc = await truncateTable(tableDef)
    if (trunc !== true) {
      console.log(`skip truncate (${trunc})`)
      failed++
      continue
    }

    const rows = generateDemoRows(tableForGen, DEMO_ROW_COUNT, dbCols)
    const { inserted, errors } = await insertRows(tableForGen, rows)

    if (inserted === DEMO_ROW_COUNT) {
      console.log(`ok (${inserted} rows)`)
      ok++
    } else if (inserted > 0) {
      console.log(`partial (${inserted}/${DEMO_ROW_COUNT}) ${errors[0] ?? ''}`)
      partial++
    } else {
      console.log(`failed ${errors[0] ?? 'no rows inserted'}`)
      failed++
    }
  }

  console.log(`\nDone: ${ok} fully seeded, ${partial} partial, ${failed} skipped/failed.`)
  await closePools()
}

seedDemoData().catch(async (err) => {
  console.error('Demo seed failed:', err.message)
  await closePools()
  process.exit(1)
})
