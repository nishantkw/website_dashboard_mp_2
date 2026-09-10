import { query } from '../db/pool.js'
import { serializeRows } from './serialize.js'
import { filterHospitalRows } from './hospitalFilters.js'
import { loadUniqueHospitalRows } from './hospitalIdentity.js'
import { deriveGeoStateType, divisionForDistrict } from '../data/mpDivisions.js'

const AUX_CACHE_TTL_MS = 15 * 60 * 1000
let deempanelDateCache = null
let lookupCache = null

function peekTimedCache(entry) {
  if (!entry) return null
  if (Date.now() - entry.loadedAt > AUX_CACHE_TTL_MS) return null
  return entry.value
}

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
  const hit = peekTimedCache(deempanelDateCache)
  if (hit) return hit
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
    deempanelDateCache = { value: map, loadedAt: Date.now() }
    return map
  } catch (err) {
    console.warn(`[hospitals] deempanel dates skipped: ${err.message}`)
    return new Map()
  }
}

export async function loadLookupRows() {
  const hit = peekTimedCache(lookupCache)
  if (hit) return hit
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.m_lookup ORDER BY lookup_cd, id_pk LIMIT 5000`
    )
    const payload = { table: serializeRows(result.rows), db: result._db }
    lookupCache = { value: payload, loadedAt: Date.now() }
    return payload
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
    nabh_certified: row.nabh_certified || row.quality_certification || '',
    district_name: row.district_name || row.dist_name || '',
    deempanel_date: formatHospitalDate(
      row.deempanel_date || row.deempaneled_date || row.deempanelment_date || extra.deempanel_date
    ),
    deempanel_status: row.deempanel_status || extra.reasons || '',
  }
}

export function isEmpaneledHospital(d) {
  const notEmpanelled = /de[- ]?empane|reject|draft|invalid|suspend|cancel|pending|not[- ]?empanel|disempanel/i
  const desc = String(d.hosp_status_desc ?? '').trim()
  if (desc) {
    if (notEmpanelled.test(desc)) return false
    return /^empane/i.test(desc)
  }
  const s = String(d.enrl_status ?? '').trim()
  if (!s) return false
  if (notEmpanelled.test(s)) return false
  if (/^empane/i.test(s)) return true
  return s === '1'
}

/** Hospital master currently de-empanelled — same definition as Empanelment Status chart. */
export function isDeempanelledHospital(d) {
  const desc = String(d.hosp_status_desc ?? '').trim()
  if (desc) return /de[- ]?empane|disempanel/i.test(desc)
  const s = String(d.enrl_status ?? '').trim()
  if (!s) return false
  if (/de[- ]?empane|disempanel/i.test(s)) return true
  return s === '0'
}

/** Canonical empanelment slice labels for charts/KPIs. */
export function labelHospitalEmpanelmentStatus(row) {
  const desc = String(row.hosp_status_desc ?? '').trim()
  if (desc) {
    if (/de[- ]?empane|disempanel/i.test(desc)) return 'De-empanelled'
    if (/^empane/i.test(desc)) return 'Empanelled'
    if (/pending/i.test(desc)) return 'Pending'
    if (/inactive/i.test(desc)) return 'Inactive'
    if (/reject/i.test(desc)) return 'Rejected'
    if (/draft/i.test(desc)) return 'Draft'
    if (/invalid/i.test(desc)) return 'Invalid'
    if (/suspend/i.test(desc)) return 'Suspended'
    return desc
  }
  const s = String(row.enrl_status ?? '').trim()
  if (!s) return 'Unknown'
  if (/de[- ]?empane|disempanel/i.test(s) || s === '0') return 'De-empanelled'
  if (/^empane/i.test(s) || s === '1') return 'Empanelled'
  if (/pending/i.test(s) || s === '2') return 'Pending'
  if (/inactive/i.test(s)) return 'Inactive'
  if (/^active$/i.test(s)) return 'Empanelled'
  return s
}

export function isActiveHospital(d) {
  const active = /^(1|active|yes|true)$/i.test(String(d.active_status ?? '').trim())
  return active && isEmpaneledHospital(d)
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

/** True for de-empanel / disempanel action rows (not revoke-only). */
export function isDeempanelDeEmpanel(d) {
  const blob = [d.type, d.action_type, d.action, d.reasons, d.status]
    .map((v) => String(v ?? '').trim())
    .filter(Boolean)
    .join(' ')
  if (!blob) return false
  if (/revoke/i.test(blob) && !/de[- ]?empanel|disempanel/i.test(blob)) return false
  return /de[- ]?empanel|disempanel/i.test(blob)
}

export function isDeempanelRevoke(d) {
  return /revoke/i.test(String(d.type ?? d.action_type ?? d.action ?? ''))
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

function normalizeDeempanelRow(row, hospById = new Map()) {
  const hospId = String(row.hosp_id ?? '').trim()
  const stopRaw = String(row.stop_payment ?? '').trim()
  const statusRaw = String(row.status ?? '').trim()
  const hosp = hospById.get(hospId) || {}
  const district = String(hosp.district_name || row.district_name || row.dist_name || '').trim()
  const hospitalType = String(hosp.hospital_type || '').trim()
  const geoRow = {
    district_name: district,
    division_name: hosp.division_name || (district ? divisionForDistrict(district) : ''),
  }
  return {
    ...row,
    hosp_id: hospId,
    hospital_name: hosp.hospital_name || row.hospital_name || '',
    // Hospital geo / type so page filters (state_type, district, hospital_type) match KPI scope.
    // Keep action `type` as-is; prefer hospital_type for ownership filters.
    hospital_type: hospitalType,
    _hospital_type: hospitalType,
    district_name: district,
    dist_name: district,
    division_name: geoRow.division_name,
    _state_type: hosp._state_type || (district ? deriveGeoStateType(geoRow) : ''),
    stop_payment: !stopRaw ? '' : isDeempanelStopPayment(row) ? 'Yes' : 'No',
    status: statusRaw === '1' ? 'Active' : statusRaw,
    deempanel_date: formatHospitalDate(row.end_date || row.start_date || row.due_date),
  }
}

/**
 * Load deempanel rows. When hospitalRows is an array (filtered hospital master),
 * keep only actions for those hospitals and enrich with hospital geo/type so
 * KPI counts and client drill-down filters stay aligned.
 * Pass null/undefined to load all rows without hospital scoping.
 */
export async function loadDeempanelRows(hospitalRows = null) {
  try {
    const result = await query(
      `SELECT * FROM dmart_mp.t_deempanelment_details
       ORDER BY COALESCE(start_date, created_dt) DESC NULLS LAST
       LIMIT 5000`
    )
    const hospById = new Map()
    const scopeToHospitals = Array.isArray(hospitalRows)
    for (const h of hospitalRows || []) {
      const id = String(h.hosp_id ?? '').trim()
      if (!id || hospById.has(id)) continue
      const district = String(h.district_name || h.dist_name || '').trim()
      const geoRow = { district_name: district, division_name: h.division_name || '' }
      hospById.set(id, {
        hospital_name: String(h.hospital_name || h.hosp_name || '').trim(),
        hospital_type: String(h.hospital_type || '').trim(),
        district_name: district,
        division_name: h.division_name || (district ? divisionForDistrict(district) : ''),
        _state_type: deriveGeoStateType(geoRow),
      })
    }
    const serialized = serializeRows(result.rows)
      .filter((row) => {
        if (!scopeToHospitals) return true
        const id = String(row.hosp_id ?? '').trim()
        return Boolean(id && hospById.has(id))
      })
      .map((row) => normalizeDeempanelRow(row, hospById))
    return {
      table: serialized,
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
  const [unique, deempanelByHosp, lookupLoad] = await Promise.all([
    loadUniqueHospitalRows(),
    loadDeempanelDateMap(),
    loadLookupRows(),
  ])
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
