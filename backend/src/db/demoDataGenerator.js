import { MP_DIVISIONS } from '../data/mpDivisions.js'

export const DEMO_ROW_COUNT = 20

const DISTRICTS = [...new Set(MP_DIVISIONS.flatMap((d) => d.districts))].sort()
const DIVISIONS = MP_DIVISIONS.map((d) => d.division)

const STATUS_TEXT = ['Active', 'Pending', 'Approved', 'Paid', 'Rejected', 'Under Review']
const CARD_STATUS = ['Delivered', 'Printed', 'Approved', 'Pending', 'Distributed']
const GENDERS = ['Male', 'Female']
const URBAN_RURAL = ['Urban', 'Rural']
const CASE_TYPES = ['MP', 'Portability']
const HOSP_TYPES = ['Public', 'Private']

function pick(list, index) {
  return list[index % list.length]
}

function pad(n, width = 4) {
  return String(n).padStart(width, '0')
}

function isNumericType(type = '') {
  return /numeric|integer|bigint|smallint|real|double|decimal|int/.test(type)
}

function isTimestampType(type = '') {
  return /timestamp|date|time/.test(type)
}

function isBooleanLike(name, type) {
  return /bool/.test(type) || /^(active_status|flag|is_|has_)/.test(name)
}

function textPrimaryKey(tableKey, i) {
  return `${tableKey}-${pad(i)}`
}

function isBooleanType(type = '') {
  return /bool/.test(type)
}

/** Generate one cell value from column metadata and row index. */
export function demoCellValue(column, rowIndex, tableDef) {
  const name = column.name.toLowerCase()
  const type = (column.type || 'text').toLowerCase()
  const i = rowIndex + 1
  const pk = (tableDef.primaryKey || '').toLowerCase()
  const tableKey = tableDef.table.replace(/[^a-z0-9]/gi, '').slice(0, 12).toUpperCase()

  if (tableDef.autoGeneratePk && name === pk) {
    return undefined
  }

  if (isBooleanType(type)) {
    return i % 2 === 0
  }

  if (isNumericType(type)) {
    if (name === pk || name === 'id_pk' || name.endsWith('_id_pk')) {
      return i * 1000 + rowIndex
    }
    if (name.includes('district') && (name.endsWith('_cd') || name.endsWith('_code'))) {
      return (i % 50) + 1
    }
    if (name.includes('state') && (name.endsWith('_cd') || name.endsWith('_code'))) {
      return 23
    }
    if (name.includes('status_id')) return i % 6
    if (name.includes('enrol_status') || name === 'enrol_status') return i % 4
    if (isBooleanLike(name, type)) return i % 2
    if (name.includes('amount') || name.includes('cost') || name.includes('risk_score')) {
      return i * 12500
    }
    if (name.includes('capacity') || name.includes('bed')) return 50 + i * 5
    if (name.includes('age')) return 20 + (i % 50)
    if (name.includes('code') && !name.includes('name')) return 1000 + i
    if (name.includes('userid') || name === 'user_id') return 10000 + i
    return i * 10
  }

  if (isTimestampType(type)) {
    // Spread across current + previous calendar months so MoM KPI % is meaningful
    const now = new Date()
    const monthsAgo = rowIndex < 12 ? 0 : 1
    const day = ((i - 1) % 27) + 1
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, day, 10, 0, 0))
    return d.toISOString()
  }

  if (name === pk || name === 'registration_id') {
    if (isNumericType(type)) return i * 1000 + rowIndex
    return textPrimaryKey(tableKey, i)
  }

  if (name === 'ben_id') return `BEN-MP-${450000 + i}`
  if (name === 'case_id') return `CASE-MP-${100000 + i}`
  if (name === 'reference_number') return `FRD-2025-${pad(i, 3)}`
  if (name === 'userid' || name === 'user_id') return `USR-${pad(i)}`
  if (name === 'workflow_user') return `WFU-${pad(i)}`
  if (name === 'hospital_code' || name === 'code' || name === 'facility_id') return `HSP-${pad(i)}`
  if (name === 'card_no') return `CARD-${450000 + i}`
  if (name === 'family_id') return `FAM-${90000 + i}`
  if (name === 'member_id') return pad(i % 5, 2)
  if (name === 'abha_id') return i % 3 === 0 ? '-' : `ABHA-${450000 + i}`
  if (name === 'suspicion_id') return `SUSP-${pad(i)}`
  if (name === 'entity_id') return `ENT-${pad(i)}`

  if (name.includes('district') && name.includes('name')) return pick(DISTRICTS, rowIndex % 10)
  if (name === 'dist_name' || name === 'district_name' || name === 'hosp_district_name' || name === 'patient_district_name') {
    return pick(DISTRICTS, rowIndex % 10)
  }
  if (name.includes('division')) return pick(DIVISIONS, rowIndex)
  if (name.includes('state_name') || name === 'state') return 'Madhya Pradesh'
  if (name.includes('state_lgd') || name === 'state_cd') return '23'

  if (name === 'gender') return pick(GENDERS, rowIndex)
  if (name.includes('urban') || name.includes('rural')) return pick(URBAN_RURAL, rowIndex)
  if (name.includes('case_type')) return pick(CASE_TYPES, rowIndex)
  if (name.includes('hospital_type') || (name === 'type' && tableDef.module === 'hospitals')) {
    return pick(HOSP_TYPES, rowIndex)
  }

  if (name.includes('case_status') || name === 'status' || name.includes('enrl_status') || name.includes('enrol')) {
    return pick(STATUS_TEXT, rowIndex)
  }
  if (name.includes('card_status') || name.includes('print_status')) return pick(CARD_STATUS, rowIndex)
  if (name.includes('investigation')) return pick(['Open', 'Closed', 'Under Review', 'Confirmed'], rowIndex)
  if (name.includes('role')) return pick(['SHA Reviewer', 'Hospital User', 'CRC Officer', 'MAC Analyst'], rowIndex)
  if (name.includes('department')) return pick(['Claims', 'Audit', 'Enrollment', 'IT'], rowIndex)
  if (name.includes('course') || name.includes('pmjay') || name.includes('abdm')) {
    return pick(['Completed', 'In Progress', 'Not Started'], rowIndex)
  }
  if (name.includes('fraud') || name.includes('trigger_type')) {
    return pick(['DUP-CLAIM', 'GEO-MISMATCH', 'AMOUNT-SPIKE', 'DOC-MISMATCH'], rowIndex)
  }
  if (name.includes('application_type')) return pick(['CLAIM', 'PREAUTH'], rowIndex)
  if (name.includes('entity_type')) return pick(['HOSPITAL', 'DOCTOR', 'BENEFICIARY'], rowIndex)
  if (name.includes('ekyc')) return pick(['Completed', 'Pending'], rowIndex)
  if (name.includes('nabh')) return pick(['Yes', 'No', 'Applied'], rowIndex)

  if (name.includes('email')) return `demo${i}@example.com`
  if (name.includes('mobile') || name.includes('phone')) return `98765${pad(10000 + i, 5)}`
  if (name.includes('pincode')) return `4620${pad(i, 2)}`
  if (name.includes('icd')) return `A${pad(10 + (i % 90), 2)}`
  if (name.includes('procedure')) return pick(['Knee Replacement', 'CABG', 'Cataract', 'Dialysis', 'Maternity'], rowIndex)

  if (name.includes('patient_name') || name === 'name' || name.endsWith('_name')) {
    return `Demo ${name.replace(/_/g, ' ')} ${i}`
  }
  if (name.includes('hospital')) return `Demo Hospital ${pick(DISTRICTS, rowIndex)} ${i}`

  if (name.includes('created_by') || name.includes('updated_by') || name.includes('crt_usr') || name.includes('updt_usr')) {
    return 'demo.seed'
  }

  if (name.includes('remarks') || name.includes('reason') || name.includes('description')) {
    return `Demo record ${i} for ${tableDef.table}`
  }

  if (name.startsWith('json_') || name.includes('json')) return `{}`

  return `${name}_${i}`
}

export function generateDemoRows(tableDef, count = DEMO_ROW_COUNT, dbColumns = null) {
  const columns = dbColumns?.length
    ? dbColumns.map((c) => {
        const reg = tableDef.columns.find((r) => r.name === c.name)
        return { name: c.name, type: c.type || reg?.type || 'text' }
      })
    : tableDef.columns

  const rows = []
  for (let rowIndex = 0; rowIndex < count; rowIndex++) {
    const row = {}
    for (const col of columns) {
      const val = demoCellValue(col, rowIndex, tableDef)
      if (val !== undefined) row[col.name] = val
    }
    if (Object.keys(row).length > 0) rows.push(row)
  }
  return rows
}

/** Unique physical tables for seeding (first registry entry wins). */
export function getDemoSeedTables(getImportTables) {
  const seen = new Set()
  const tables = []

  for (const t of getImportTables()) {
    if (t.module === 'ump') continue
    if (t.schema === 'app_auth') continue
    if (t.id.includes('ump')) continue

    const key = `${t.schema}.${t.table}`
    if (seen.has(key)) continue
    seen.add(key)
    tables.push(t)
  }

  return tables.sort((a, b) => a.id.localeCompare(b.id))
}
