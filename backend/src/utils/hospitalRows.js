import { query } from '../db/pool.js'
import { serializeRows } from './serialize.js'
import { filterHospitalRows } from './hospitalFilters.js'
import { loadUniqueHospitalRows } from './hospitalIdentity.js'

function mapHospitalType(raw, lookupByCd = new Map()) {
  const t = String(raw || '').trim()
  if (!t) return t
  const fromLookup = lookupByCd.get(t)
  if (fromLookup) return fromLookup
  if (/^g$/i.test(t) || /gov/i.test(t)) return 'Government'
  if (/^p$/i.test(t) || /priv/i.test(t)) return 'Private'
  return t
}

function formatHospitalDate(v) {
  if (v == null || v === '') return ''
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().replace('T', ' ').slice(0, 19)
  }
  return String(v).trim()
}

export async function loadDeempanelDateMap() {
  try {
    const { rows } = await query(
      `SELECT DISTINCT ON (hosp_id)
         hosp_id::text AS hosp_id,
         COALESCE(end_date, start_date, due_date) AS deempanel_date,
         reasons
       FROM dmart_mp.t_deempanelment_details
       WHERE hosp_id IS NOT NULL
       ORDER BY hosp_id, COALESCE(end_date, start_date, due_date) DESC NULLS LAST`
    )
    const map = new Map()
    for (const row of rows) {
      map.set(String(row.hosp_id).trim(), {
        deempanel_date: formatHospitalDate(row.deempanel_date),
        reasons: row.reasons ? String(row.reasons).trim() : '',
      })
    }
    return map
  } catch (err) {
    console.warn(`[hospitals] deempanel dates skipped: ${err.message}`)
    return new Map()
  }
}

export async function loadLookupRows() {
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.m_lookup ORDER BY lookup_cd, id_pk LIMIT 5000`
    )
    return { table: serializeRows(result.rows), db: result._db }
  } catch (err) {
    console.warn(`[hospitals] m_lookup skipped: ${err.message}`)
    return { table: [], db: null }
  }
}

function lookupCodeMap(lookupRows) {
  const map = new Map()
  for (const row of lookupRows) {
    const cd = String(row.lookup_cd || '').trim()
    const val = String(row.lookup_value || '').trim()
    if (!cd || !val || map.has(cd)) continue
    map.set(cd, val)
  }
  return map
}

export function normalizeHospitalRow(row, deempanelByHosp = new Map(), lookupByCd = new Map()) {
  const hospitalName = String(row.hospital_name || row.hosp_name || '').trim()
  const type = mapHospitalType(row.hospital_type, lookupByCd)
  const extra = deempanelByHosp.get(String(row.hosp_id ?? '').trim()) || {}
  return {
    ...row,
    hospital_name: hospitalName,
    hosp_name: row.hosp_name || hospitalName,
    hospital_code: row.hospital_code || row.facility_id || row.hosp_id,
    hospital_type: type || row.hospital_type,
    empaneled_date: formatHospitalDate(row.empaneled_date || row.hosp_empaneled_date),
    nabh_certified: row.nabh_certified || row.quality_certification || row.accreditation_status,
    district_name: row.district_name || row.dist_name || '',
    deempanel_date: formatHospitalDate(
      row.deempanel_date || row.deempaneled_date || row.deempanelment_date || extra.deempanel_date
    ),
    deempanel_status: row.deempanel_status || extra.reasons || '',
  }
}

export function isActiveHospital(d) {
  return /^(1|active|yes|true)$/i.test(String(d.active_status ?? '').trim())
}

export function isEmpaneledHospital(d) {
  const desc = String(d.hosp_status_desc ?? '').trim()
  if (desc) {
    if (/de[- ]?empane/i.test(desc)) return false
    return /^empane/i.test(desc)
  }
  const s = String(d.enrl_status ?? '').trim()
  if (!s) return false
  if (/de[- ]?empane/i.test(s)) return false
  if (/^empane/i.test(s)) return true
  return s === '1'
}

export function isGovHospital(d) {
  return /gov|^g$/i.test(String(d.hospital_type ?? '').trim())
}

export function isPrivHospital(d) {
  return /priv|^p$/i.test(String(d.hospital_type ?? '').trim())
}

export function isDeempanelStopPayment(d) {
  return /^(true|t|1|yes)$/i.test(String(d.stop_payment ?? '').trim())
}

export function isDeempanelDeEmpanel(d) {
  return /de[- ]?empanel/i.test(String(d.type ?? ''))
}

export function isDeempanelRevoke(d) {
  return /revoke/i.test(String(d.type ?? ''))
}

export function hasDeempanelEndDate(d) {
  return Boolean(String(d.end_date ?? '').trim())
}

function labelHemActive(val) {
  const s = String(val ?? '').trim()
  if (/^(1|active|yes|true)$/i.test(s)) return 'Active'
  if (/^(0|inactive|no|false)$/i.test(s)) return 'Inactive'
  return s
}

export function isHemActive(d) {
  return /^(1|active|yes|true)$/i.test(String(d.active_status ?? '').trim())
}

export function isHemGov(d) {
  return /gov|^g$/i.test(String(d.hosp_type_cd ?? d.hospital_type ?? '').trim())
}

export function isHemPriv(d) {
  return /priv|^p$/i.test(String(d.hosp_type_cd ?? d.hospital_type ?? '').trim())
}

export function hasHemHfr(d) {
  return Boolean(String(d.hfr_hosp_id ?? '').trim())
}

export function hasHemNodal(d) {
  return Boolean(String(d.nodal_officer_name ?? '').trim())
}

function normalizeHemRow(row) {
  return {
    ...row,
    hospital_name: String(row.hosp_name || row.hospital_name || '').trim(),
    hosp_type_cd: mapHospitalType(row.hosp_type_cd) || row.hosp_type_cd,
    active_status: labelHemActive(row.active_status) || row.active_status,
    empaneled_date: formatHospitalDate(row.empaneled_date),
    certificate_expiry_date: formatHospitalDate(row.certificate_expiry_date),
    establishment_year: formatHospitalDate(row.establishment_year),
    created_dt: formatHospitalDate(row.created_dt),
    updated_dt: formatHospitalDate(row.updated_dt),
  }
}

export async function loadHemHospitalRows() {
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.t_hem_hospital
       ORDER BY COALESCE(updated_dt, created_dt) DESC NULLS LAST
       LIMIT 5000`
    )
    return {
      table: serializeRows(result.rows).map(normalizeHemRow),
      db: result._db,
    }
  } catch (err) {
    console.warn(`[hospitals] t_hem_hospital skipped: ${err.message}`)
    return { table: [], db: null }
  }
}

function normalizeDeempanelRow(row, nameByHosp = new Map()) {
  const hospId = String(row.hosp_id ?? '').trim()
  const stopRaw = String(row.stop_payment ?? '').trim()
  const statusRaw = String(row.status ?? '').trim()
  return {
    ...row,
    hosp_id: hospId,
    hospital_name: nameByHosp.get(hospId) || row.hospital_name || '',
    stop_payment: !stopRaw ? '' : isDeempanelStopPayment(row) ? 'Yes' : 'No',
    status: statusRaw === '1' ? 'Active' : statusRaw,
    deempanel_date: formatHospitalDate(row.end_date || row.start_date || row.due_date),
  }
}

export async function loadDeempanelRows(hospitalRows = []) {
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.t_deempanelment_details
       ORDER BY COALESCE(start_date, created_dt) DESC NULLS LAST
       LIMIT 5000`
    )
    const nameByHosp = new Map()
    for (const h of hospitalRows) {
      const id = String(h.hosp_id ?? '').trim()
      const name = String(h.hospital_name || h.hosp_name || '').trim()
      if (id && name && !nameByHosp.has(id)) nameByHosp.set(id, name)
    }
    return {
      table: serializeRows(result.rows).map((row) => normalizeDeempanelRow(row, nameByHosp)),
      db: result._db,
    }
  } catch (err) {
    console.warn(`[hospitals] t_deempanelment_details skipped: ${err.message}`)
    return { table: [], db: null }
  }
}

/**
 * Unique hospital master rows (cached), then in-memory filters.
 * Full unique count is table.length; callers should page the HTTP table.
 */
export async function loadHospitalMasterRows(queryParams = {}) {
  const unique = await loadUniqueHospitalRows()
  const deempanelByHosp = await loadDeempanelDateMap()
  const lookupLoad = await loadLookupRows()
  const lookupByCd = lookupCodeMap(lookupLoad.table)
  const merged = unique.table.map((raw) => normalizeHospitalRow(raw, deempanelByHosp, lookupByCd))
  const table = filterHospitalRows(merged, queryParams)
  const columns = table[0] ? Object.keys(table[0]) : unique.columns
  return {
    table,
    columns,
    schema: unique.schema,
    db: unique.db,
    lookupTable: lookupLoad.table,
  }
}
