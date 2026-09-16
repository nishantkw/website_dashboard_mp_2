import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sqlPath = path.join(__dirname, '../sql/010_pmjay_schema_ref_tables.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')
const url = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/pmjay_dashboard'

const client = new pg.Client({ connectionString: url })
await client.connect()
await client.query(sql)
const r = await client.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'dmart_mp'
    AND table_name IN (
      'already_printed_card_no_290626',
      'already_printed_card_no_34321992_8672488_09082026',
      'card_print_data_madhya_pradesh_01aug2025',
      'card_print_data_madhya_pradesh_vvs_29may2025_f',
      'card_print_data_temp_t_bis_ekyc_dtl_mp_20260703_with_village_name',
      'left_over_cards_for_print_of_mp_with_village_name_09aug2026_final',
      'pvtg_by_district_7march_v3',
      't_beneficiary_ekyc_dtls_17july2025_old',
      't_bis_beneficiary_disabled_19aug2025',
      'm_status_bis',
      'm_status_tms',
      't_hem_manpower',
      'json_data',
      'treatment_stratification_details'
    )
  ORDER BY 1
`)
console.log(`Created/verified ${r.rows.length} tables:`)
for (const row of r.rows) console.log(' ', row.table_name)
await client.end()
