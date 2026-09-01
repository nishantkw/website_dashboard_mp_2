/** Charts and KPIs from dmart_mp.m_source_data (beneficiary source / family intake). */

import {
  labelRuralUrban,
  matchesRuralUrbanFilter,
} from './ruralUrban.js'
import { matchesGenderFilter, matchesEnrlFilter, matchesCardFilter, labelCardStatus, labelRelation } from './beneficiaryCodes.js'

function labelOrUnknown(val) {
  const s = String(val ?? '').trim()
  return s || 'Unknown'
}

function topEntries(entries, limit = 8, valueKey = 'value') {
  const sorted = [...entries].sort((a, b) => Number(b[valueKey] ?? 0) - Number(a[valueKey] ?? 0))
  if (sorted.length <= limit) return sorted
  const top = sorted.slice(0, limit)
  const rest = sorted.slice(limit)
  return [...top, { name: 'Others', [valueKey]: rest.reduce((sum, row) => sum + Number(row[valueKey] ?? 0), 0) }]
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

export function filterSourceRows(rows, q = {}) {
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
    if (urbanRural && !matchesRuralUrbanFilter(row.rural_urban_flag, urbanRural)) return false
    if (district && !includesIlike(row.dist_cd, district) && !includesIlike(row.dist_name, district)) {
      return false
    }
    if (search) {
      const hay = [
        row.id_pk,
        row.name,
        row.src_family_id,
        row.src_member_id,
        row.bis_member_id,
        row.bis_family_id,
        row.card_no,
        row.father_guardian_name,
        row.dist_cd,
        row.mobilenumber,
      ]
        .map((v) => String(v ?? ''))
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function uniqueFamilyCount(rows) {
  const ids = new Set()
  for (const row of rows) {
    const id = String(row.src_family_id || row.bis_family_id || '').trim()
    if (id) ids.add(id)
  }
  return ids.size
}

export function hasCardNo(row) {
  return Boolean(String(row.card_no ?? '').trim())
}

export function buildSourceKpis(rows) {
  const families = uniqueFamilyCount(rows)
  const withCard = rows.filter(hasCardNo).length
  return [
    { label: 'Source Records', value: rows.length, color: 'orange' },
    { label: 'Source Families', value: families, color: 'indigo' },
    { label: 'Source Cards', value: withCard, color: 'emerald' },
  ]
}

export function buildSourceCharts(rows) {
  const relation = topEntries(countBy(rows, (r) => labelRelation(r.relation)), 6)
  const cardStatus = topEntries(countBy(rows, (r) => labelCardStatus(r.card_status)), 6)
  const sourceType = topEntries(
    countBy(rows, (r) => labelOrUnknown(r.source_type || r.bis_source)),
    6
  )
  const ruralUrban = countBy(rows, (r) => labelRuralUrban(r.rural_urban_flag))
  const nfsa = topEntries(countBy(rows, (r) => labelOrUnknown(r.nfsa_type || r.nfsa_card_type)), 6)

  return {
    sourceRelation: hasKnown(relation) ? relation : [],
    sourceCardStatus: hasKnown(cardStatus) ? cardStatus : [],
    sourceType: hasKnown(sourceType) ? sourceType : [],
    sourceRuralUrban: hasKnown(ruralUrban) ? ruralUrban : [],
    sourceNfsa: hasKnown(nfsa) ? nfsa : [],
  }
}
