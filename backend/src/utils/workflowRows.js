import { query } from '../db/pool.js'
import { serializeRows } from './serialize.js'
import { districtsForDivision } from '../data/mpDivisions.js'

export const WORKFLOW_AUDIT_SOURCES = [
  { schema: 'dmart_mp', table: 't_workflow_transaction_audit' },
  { schema: 'dmart_mp', table: 't_workflow_transaction_audit_hem' },
]

function clean(v) {
  return String(v ?? '').trim()
}

function uniqueBy(rows, keyFn) {
  const seen = new Set()
  const out = []
  for (const row of rows) {
    const key = keyFn(row)
    if (!key || seen.has(key)) continue
    seen.add(key)
    out.push(row)
  }
  return out
}

export function workflowUserKey(row) {
  return clean(row.workflow_user || row.acted_workflow_user || row.user_id || row.user_name)
}

export function workflowRoleKey(row) {
  return clean(row.workflow_role || row.previous_workflow_role || row.dashboard_workflow_role)
}

function auditIdentity(row, source) {
  if (clean(row.id_pk)) return `${source}:id:${clean(row.id_pk)}`
  if (clean(row.work_id_pk)) return `${source}:work:${clean(row.work_id_pk)}`
  if (clean(row.workflow_transaction_id) && clean(row.created_dt)) {
    return `${source}:txn:${clean(row.workflow_transaction_id)}:${clean(row.created_dt)}`
  }
  return `${source}:${workflowUserKey(row)}:${workflowRoleKey(row)}:${clean(row.created_dt)}`
}

function isRealAuditRow(row) {
  return Boolean(
    workflowUserKey(row) ||
      workflowRoleKey(row) ||
      clean(row.workflow_process_code) ||
      clean(row.remarks)
  )
}

async function loadAll(schema, table) {
  try {
    const result = await query(`SELECT * FROM ${schema}.${table} LIMIT 10000`)
    return { rows: serializeRows(result.rows), db: result._db }
  } catch (err) {
    console.warn(`[workflow] skip ${schema}.${table}: ${err.message}`)
    return { rows: [], db: null }
  }
}

function deriveUsersFromAudit(auditRows) {
  const byUser = new Map()
  for (const row of auditRows) {
    const user = workflowUserKey(row)
    if (!user) continue
    const role = workflowRoleKey(row)
    const existing = byUser.get(user.toLowerCase())
    if (!existing) {
      byUser.set(user.toLowerCase(), {
        workflow_user: user,
        user_id: user,
        user_name: user,
        workflow_role: role,
        dashboard_workflow_role: role,
        status_descrption: clean(row.remarks),
        workflow_process_code: clean(row.workflow_process_code),
        created_dt: row.created_dt || row.hist_created_dt || row.transaction_dt || '',
        last_action_dt: row.updated_dt || row.hist_created_dt || row.created_dt || '',
      })
      continue
    }
    if (!existing.workflow_role && role) {
      existing.workflow_role = role
      existing.dashboard_workflow_role = role
    }
  }
  return [...byUser.values()]
}

export function filterWorkflowRows(rows, q = {}) {
  if (!q || (!q.district && !q.division && !q.patient_state && !q.role && !q.user_status && !q.search)) {
    return rows
  }

  const districtAllow =
    !q.district && q.division
      ? new Set(districtsForDivision(q.division).map((d) => String(d).toLowerCase()))
      : null

  return rows.filter((row) => {
    const district = clean(row.patient_district_name || row.hosp_district_name)
    if (q.district && !district.toLowerCase().includes(String(q.district).toLowerCase())) return false
    if (districtAllow?.size && !districtAllow.has(district.toLowerCase())) return false
    if (q.patient_state) {
      const state = clean(row.patient_state_name || row.hosp_state_name)
      if (!state.toLowerCase().includes(String(q.patient_state).toLowerCase())) return false
    }
    if (q.role) {
      const role = workflowRoleKey(row).toLowerCase()
      if (!role.includes(String(q.role).toLowerCase())) return false
    }
    if (q.user_status) {
      const status = clean(row.status_descrption || row.status_description).toLowerCase()
      if (!status.includes(String(q.user_status).toLowerCase())) return false
    }
    if (q.search) {
      const hay = [
        row.workflow_user,
        row.acted_workflow_user,
        row.user_id,
        row.user_name,
        row.hospital_name,
        row.registration_id,
        row.workflow_role,
      ]
        .map(clean)
        .join(' ')
        .toLowerCase()
      if (!hay.includes(String(q.search).toLowerCase())) return false
    }
    return true
  })
}

function labelOrUnknown(val) {
  return clean(val) || 'Unknown'
}

function topEntries(entries, limit = 8) {
  const sorted = [...entries].sort((a, b) => Number(b.value) - Number(a.value))
  if (sorted.length <= limit) return sorted
  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  return [...top, { name: 'Others', value: rest.reduce((s, r) => s + Number(r.value), 0) }]
}

function countBy(rows, keyFn) {
  const acc = {}
  for (const row of rows) {
    const key = keyFn(row)
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc).map(([name, value]) => ({ name, value }))
}

function hasKnown(entries) {
  return entries.some((e) => e.name !== 'Unknown')
}

function toNumber(val) {
  const n = Number(String(val ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

function formatInr(n) {
  if (n >= 10000000) {
    const cr = n / 10000000
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`
  }
  return `₹${Math.round(n).toLocaleString('en-IN')}`
}

function labelHospitalType(val) {
  const t = clean(val)
  if (/^g$/i.test(t) || /gov/i.test(t)) return 'Government'
  if (/^p$/i.test(t) || /priv/i.test(t)) return 'Private'
  return t || 'Unknown'
}

export async function loadProWorkflowRows(queryParams = {}) {
  const loaded = await loadAll('dmart_mp', 'pro_workflow_users_t')
  const table = filterWorkflowRows(loaded.rows, queryParams)
  return { table, db: loaded.db }
}

export function buildProWorkflowCharts(rows) {
  const proProcess = countBy(rows, (r) => labelOrUnknown(r.workflow_process_code))
  const proRole = topEntries(countBy(rows, (r) => workflowRoleKey(r) || 'Unknown'), 8)
  const proService = topEntries(countBy(rows, (r) => labelOrUnknown(r.service_request_type)), 8)
  const proHospitalType = countBy(rows, (r) => labelHospitalType(r.hospital_type))
  const proStatus = topEntries(countBy(rows, (r) => labelOrUnknown(r.status_descrption || r.status_description)), 8)
  const sameAsProcess =
    JSON.stringify(proService.map((e) => `${e.name}:${e.value}`).sort()) ===
    JSON.stringify(proProcess.map((e) => `${e.name}:${e.value}`).sort())
  return {
    proProcess: hasKnown(proProcess) ? proProcess : [],
    proRole: hasKnown(proRole) ? proRole : [],
    proService: hasKnown(proService) && !sameAsProcess ? proService : [],
    proHospitalType: hasKnown(proHospitalType) ? proHospitalType : [],
    proStatus: hasKnown(proStatus) ? proStatus : [],
  }
}

export function buildProWorkflowKpis(rows) {
  const users = uniqueBy(rows, (row) => workflowUserKey(row).toLowerCase()).filter((r) => workflowUserKey(r)).length
  const initiated = rows.reduce((sum, row) => sum + toNumber(row.initiated_amount), 0)
  const approved = rows.reduce((sum, row) => sum + toNumber(row.approved_amount), 0)
  return [
    { label: 'Pro Records', value: rows.length, color: 'orange' },
    { label: 'Pro Users', value: users, color: 'indigo' },
    { label: 'Pro Initiated', value: formatInr(initiated), color: 'blue' },
    { label: 'Pro Approved', value: formatInr(approved), color: 'green' },
  ]
}

export async function loadWorkflowDashboard(queryParams = {}) {
  const usersLoad = await loadAll('dmart_mp', 'workflow_users_t')
  let db = usersLoad.db
  const masterUsers = uniqueBy(usersLoad.rows, (row) => {
    const user = workflowUserKey(row).toLowerCase()
    if (user) return `u:${user}`
    return clean(row.id_pk) ? `pk:${row.id_pk}` : ''
  })

  const auditParts = []
  const usedAudit = []
  for (const src of WORKFLOW_AUDIT_SOURCES) {
    const loaded = await loadAll(src.schema, src.table)
    if (loaded.db) db = loaded.db
    const rows = uniqueBy(loaded.rows.filter(isRealAuditRow), (row) => auditIdentity(row, src.table))
    if (rows.length) {
      usedAudit.push(`${src.schema}.${src.table}`)
      auditParts.push(...rows)
    }
  }
  const audit = uniqueBy(auditParts, (row) =>
    auditIdentity(row, clean(row.id_pk) ? 't_workflow_transaction_audit_hem' : 't_workflow_transaction_audit')
  )

  const table = masterUsers.length ? masterUsers : deriveUsersFromAudit(audit)
  const filteredUsers = filterWorkflowRows(table, queryParams)
  const filteredAudit = filterWorkflowRows(audit, queryParams)

  const uniqueUsers = uniqueBy(filteredUsers, (row) => workflowUserKey(row).toLowerCase())
  const roles = new Set()
  for (const row of filteredUsers) {
    const role = workflowRoleKey(row)
    if (role) roles.add(role)
  }
  for (const row of filteredAudit) {
    const role = workflowRoleKey(row)
    if (role) roles.add(role)
  }

  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  function formatMonthLabel(ym) {
    const m = String(ym).match(/^(\d{4})-(\d{2})$/)
    if (!m) return String(ym)
    const month = MONTH_SHORT[Number(m[2]) - 1]
    return month ? `${month} ${m[1]}` : String(ym)
  }

  const byRole = {}
  const byStatus = {}
  const hospitals = new Set()
  const districts = new Set()
  let clmCount = 0
  for (const row of uniqueUsers) {
    const role = workflowRoleKey(row) || 'Unknown'
    const status = clean(row.status_descrption || row.status_description) || 'Unknown'
    byRole[role] = (byRole[role] || 0) + 1
    byStatus[status] = (byStatus[status] || 0) + 1
    const hosp = clean(row.hospital_name)
    if (hosp) hospitals.add(hosp)
    const dist = clean(row.patient_district_name || row.hosp_district_name)
    if (dist) districts.add(dist)
    if (/^CLM/i.test(clean(row.workflow_process_code))) clmCount += 1
  }

  const processChart = countBy(uniqueUsers, (r) => clean(r.workflow_process_code) || 'Unknown')
  const districtChart = topEntries(
    countBy(uniqueUsers, (r) => clean(r.patient_district_name || r.hosp_district_name) || 'Unknown')
  )
  const hospitalChart = topEntries(countBy(uniqueUsers, (r) => clean(r.hospital_name) || 'Unknown'))

  const auditRole = topEntries(
    countBy(filteredAudit, (r) => workflowRoleKey(r) || 'Unknown').filter((e) => e.name !== 'Unknown')
  )
  const auditProcess = topEntries(
    countBy(filteredAudit, (r) => clean(r.workflow_process_code) || 'Unknown')
  )
  const scheme = countBy(filteredAudit, (r) => clean(r.scheme_code) || 'Unknown')

  const byMonth = {}
  for (const row of filteredAudit) {
    const ym = String(row.created_dt || row.transaction_dt || '').slice(0, 7)
    if (!ym || ym.length < 7) continue
    byMonth[ym] = (byMonth[ym] || 0) + 1
  }
  const auditTrend = Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => ({ name: formatMonthLabel(name), value }))

  const schemaParts = []
  if (masterUsers.length) schemaParts.push('dmart_mp.workflow_users_t')
  schemaParts.push(...usedAudit)
  const proLoad = await loadProWorkflowRows(queryParams)
  if (proLoad.db && !db) db = proLoad.db
  if (proLoad.table.length) schemaParts.push('dmart_mp.pro_workflow_users_t')

  return {
    db,
    schema: schemaParts.join(' + ') || 'dmart_mp.workflow_users_t',
    table: uniqueUsers,
    audit: filteredAudit,
    proTable: proLoad.table,
    uniqueUserCount: uniqueUsers.length,
    uniqueRoleCount: roles.size,
    hospitalCount: hospitals.size,
    districtCount: districts.size,
    clmCount,
    charts: {
      roleDistribution: Object.entries(byRole).map(([name, value]) => ({ name, value })),
      workflowStatus: Object.entries(byStatus).map(([name, value]) => ({ name, value })),
      process: processChart,
      district: districtChart,
      hospital: hospitalChart,
      auditRole,
      auditProcess,
      scheme,
      auditTrend,
      ...buildProWorkflowCharts(proLoad.table),
    },
  }
}
