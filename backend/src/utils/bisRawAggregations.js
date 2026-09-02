/** Load helpers for bis_raw.t_bis_beneficiary_dtls (raw BIS beneficiary master). */

import { matchesRuralUrbanFilter, rowRuralUrbanFlag } from './ruralUrban.js'
import {
  matchesGenderFilter,
  matchesEnrlFilter,
  matchesCardFilter,
  labelGender,
  labelEnrlStatus,
  labelCardStatus,
  labelSourceType,
  isActiveRecord,
} from './beneficiaryCodes.js'

function labelOrUnknown(val) {
  const s = String(val ?? '').trim()
  return s || 'Unknown'
}

function topEntries(entries, limit = 8) {
  const sorted = [...entries].sort((a, b) => Number(b.value) - Number(a.value))
  if (sorted.length <= limit) return sorted
  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  return [...top, { name: 'Others', value: rest.reduce((sum, row) => sum + Number(row.value), 0) }]
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

function includesIlike(rowVal, filterVal) {
  if (!filterVal) return true
  return String(rowVal ?? '')
    .toLowerCase()
    .includes(String(filterVal).trim().toLowerCase())
}

export function filterBisRawRows(rows, q = {}) {
  const search = String(q.search || '').trim().toLowerCase()
  const gender = String(q.gender || '').trim()
  const enrl = String(q.enrollment_status || '').trim()
  const card = String(q.card_status || '').trim()
  const urbanRural = String(q.urban_rural || '').trim()
  const district = String(q.district || '').trim()

  return rows.filter((row) => {
    if (!matchesGenderFilter(row.gender, gender)) return false
    if (!matchesEnrlFilter(row.enrl_status, enrl)) return false
    if (!matchesCardFilter(row.card_status, card)) return false
    if (urbanRural && !matchesRuralUrbanFilter(rowRuralUrbanFlag(row), urbanRural)) return false
    if (district && !includesIlike(row.dist_name, district) && !includesIlike(row.dist_cd, district)) {
      return false
    }
    if (search) {
      const hay = [
        row.ben_id,
        row.family_id,
        row.member_id,
        row.name,
        row.card_no,
        row.dist_name,
        row.dist_cd,
        row.abha_id,
        row.id_pk,
      ]
        .map((v) => String(v ?? ''))
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function buildBisRawKpis(rows) {
  const families = new Set(rows.map((r) => String(r.family_id ?? '').trim()).filter(Boolean)).size
  const active = rows.filter(isActiveRecord).length
  return [
    { label: 'BIS Records', value: rows.length, color: 'orange' },
    { label: 'BIS Families', value: families, color: 'indigo' },
    { label: 'BIS Active', value: active, color: 'green' },
  ]
}

export function buildBisRawCharts(rows) {
  const bisGender = countBy(rows, (r) => labelGender(r.gender))
  const bisEnroll = countBy(rows, (r) => labelEnrlStatus(r.enrl_status))
  const bisSourceType = topEntries(countBy(rows, (r) => labelSourceType(r.source_type)), 6)
  const bisCardStatus = topEntries(countBy(rows, (r) => labelCardStatus(r.card_status)), 6)
  return {
    bisGender: hasKnown(bisGender) ? bisGender : [],
    bisEnroll: hasKnown(bisEnroll) ? bisEnroll : [],
    bisSourceType: hasKnown(bisSourceType) ? bisSourceType : [],
    bisCardStatus: hasKnown(bisCardStatus) ? bisCardStatus : [],
  }
}
