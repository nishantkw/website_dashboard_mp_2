import { createRequire } from 'module'
import { splitFileDuplicates, pickRawKeyHeaders } from './dedupe.js'
const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

function stripWrap(s) {
  return String(s ?? '')
    .replace(/^\uFEFF/, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}

/**
 * RFC4180-style CSV: commas/newlines inside quotes stay in the same field/row.
 * Splitting on raw newlines first was turning multi-line remarks into extra rows.
 */
function parseCsvRecords(text) {
  const s = String(text || '').replace(/^\uFEFF/, '')
  const records = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    if (row.some((cell) => String(cell).trim() !== '')) records.push(row)
    row = []
  }

  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    const next = s[i + 1]
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
      continue
    }
    if (c === ',' || c === '\t') {
      pushField()
      continue
    }
    if (c === '\n' || c === '\r') {
      if (c === '\r' && next === '\n') i++
      pushField()
      pushRow()
      continue
    }
    field += c
  }
  if (field.length > 0 || row.length > 0) {
    pushField()
    pushRow()
  }
  return records
}

function fileDupeReport(deduped) {
  const cap = 150
  return {
    fileDuplicates: deduped.duplicates,
    keyCols: deduped.keyCols || [],
    exactCopies: (deduped.exactCopies || []).slice(0, cap),
    exactCopyCount: (deduped.exactCopies || []).length,
    keyOnlyDiffs: (deduped.keyOnlyDiffs || []).slice(0, cap),
    keyOnlyDiffCount: (deduped.keyOnlyDiffs || []).length,
  }
}

export function parseCsvText(csvText) {
  const records = parseCsvRecords(csvText)
  if (!records.length) return { headers: [], rows: [], fileDuplicates: 0, duplicateReport: fileDupeReport({ duplicates: 0, exactCopies: [], keyOnlyDiffs: [], keyCols: [] }) }

  const headers = records[0].map(stripWrap).filter(Boolean)
  const rows = []
  for (let i = 1; i < records.length; i++) {
    const values = records[i]
    if (values.length === 0 || values.every((v) => stripWrap(v) === '')) continue
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = stripWrap(values[idx] ?? '')
    })
    rows.push(row)
  }
  const keyCols = pickRawKeyHeaders(headers)
  const deduped = splitFileDuplicates(rows, keyCols)
  return {
    headers,
    rows: deduped.rows,
    fileDuplicates: deduped.duplicates,
    duplicateReport: fileDupeReport(deduped),
  }
}

function cellToString(value) {
  if (value == null) return ''
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  return String(value).trim()
}

export function parseSpreadsheetBuffer(buffer, originalName = '') {
  const lower = originalName.toLowerCase()
  const isExcel = lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.xlsm')

  if (!isExcel) {
    return parseCsvText(buffer.toString('utf8'))
  }

  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) return { headers: [], rows: [], sheetName: null, fileDuplicates: 0, duplicateReport: fileDupeReport({ duplicates: 0, exactCopies: [], keyOnlyDiffs: [], keyCols: [] }) }

  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  if (!matrix.length) return { headers: [], rows: [], sheetName }

  const headers = matrix[0].map((h, i) => stripWrap(h) || `column_${i + 1}`)
  const rows = []
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i] || []
    if (line.every((c) => cellToString(c) === '')) continue
    const row = {}
    headers.forEach((header, idx) => {
      row[header] = cellToString(line[idx])
    })
    rows.push(row)
  }
  const keyCols = pickRawKeyHeaders(headers)
  const deduped = splitFileDuplicates(rows, keyCols)
  return { headers, rows: deduped.rows, sheetName, fileDuplicates: deduped.duplicates, duplicateReport: fileDupeReport(deduped) }
}

export function applyMapping(rawRows, mapping) {
  return rawRows.map((raw) => {
    const out = {}
    for (const [csvHeader, dbCol] of Object.entries(mapping || {})) {
      if (!dbCol) continue
      if (raw[csvHeader] !== undefined) out[dbCol] = raw[csvHeader]
    }
    return out
  })
}
