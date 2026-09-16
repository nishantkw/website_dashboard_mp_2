import pg from 'pg'

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/pmjay_dashboard',
})
await client.connect()
const r = await client.query(`
  SELECT table_name, length(table_name) AS len
  FROM information_schema.tables
  WHERE table_schema = 'dmart_mp'
    AND (
      table_name LIKE 'already_printed%'
      OR table_name LIKE 'card_print%'
      OR table_name LIKE 'left_over%'
      OR table_name LIKE 'pvtg%'
      OR table_name LIKE 't_beneficiary%'
      OR table_name LIKE 't_bis_beneficiary_disabled_19%'
      OR table_name LIKE 'm_status%'
      OR table_name = 't_hem_manpower'
      OR table_name = 'json_data'
      OR table_name = 'treatment_stratification_details'
    )
  ORDER BY 1
`)
for (const row of r.rows) console.log(row.len, row.table_name)
await client.end()
