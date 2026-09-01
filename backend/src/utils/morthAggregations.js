import { labelGender } from './beneficiaryCodes.js'
import { buildKpi } from './kpiChange.js'

function countBy(rows, keyFn) {
  const acc = {}
  for (const row of rows) {
    const key = keyFn(row)
    acc[key] = (acc[key] || 0) + 1
  }
  return Object.entries(acc)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function filled(val) {
  return Boolean(String(val ?? '').trim())
}

export function labelConscious(val) {
  const s = String(val ?? '').trim()
  if (/^(y|yes|1|uncon)/i.test(s)) return 'Unconscious'
  if (/^(n|no|0|con)/i.test(s)) return 'Conscious'
  return s || 'Unknown'
}

export function isMorthMale(row) {
  return labelGender(row.gender) === 'Male'
}

export function isMorthFemale(row) {
  return labelGender(row.gender) === 'Female'
}

export function isMorthUnconscious(row) {
  return labelConscious(row.patient_con_uncon) === 'Unconscious'
}

export function isMorthGrievous(row) {
  return /grievous/i.test(String(row.accident_severity ?? ''))
}

export function hasMorthGovtId(row) {
  return filled(row.govt_id)
}

export function normalizeMorthRow(row) {
  return {
    ...row,
    gender: labelGender(row.gender) === 'Unknown' ? row.gender : labelGender(row.gender),
    patient_con_uncon:
      labelConscious(row.patient_con_uncon) === 'Unknown' ? row.patient_con_uncon : labelConscious(row.patient_con_uncon),
  }
}

export function buildMorthCharts(rows) {
  const severity = countBy(rows, (r) => String(r.accident_severity || 'Unknown').trim() || 'Unknown')
  const gender = countBy(rows, (r) => labelGender(r.gender))
  const knownSev = severity.some((e) => e.name !== 'Unknown')
  const knownGen = gender.some((e) => e.name !== 'Unknown')
  return {
    morthSeverity: knownSev ? severity : [],
    morthGender: knownGen ? gender : [],
  }
}

export function buildMorthKpis(rows) {
  const dateFields = ['created_dt', 'updated_dt', 'edar_update_time']
  return [
    buildKpi({ label: 'MORTH Records', value: rows.length, color: 'indigo', rows, dateFields }),
    buildKpi({
      label: 'MORTH Male',
      value: rows.filter(isMorthMale).length,
      color: 'blue',
      rows,
      dateFields,
      predicate: isMorthMale,
    }),
    buildKpi({
      label: 'MORTH Female',
      value: rows.filter(isMorthFemale).length,
      color: 'purple',
      rows,
      dateFields,
      predicate: isMorthFemale,
    }),
    buildKpi({
      label: 'MORTH Unconscious',
      value: rows.filter(isMorthUnconscious).length,
      color: 'orange',
      rows,
      dateFields,
      predicate: isMorthUnconscious,
    }),
    buildKpi({
      label: 'MORTH Grievous',
      value: rows.filter(isMorthGrievous).length,
      color: 'red',
      rows,
      dateFields,
      predicate: isMorthGrievous,
    }),
    buildKpi({
      label: 'MORTH With Govt ID',
      value: rows.filter(hasMorthGovtId).length,
      color: 'cyan',
      rows,
      dateFields,
      predicate: hasMorthGovtId,
    }),
  ]
}
