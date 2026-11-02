import Papa from 'papaparse'

export const AUDITGEN_PERCENTS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
]

export interface AuditGenMeta {
  fileName: string
  sizeBytes: number
  headers: string[]
  totalRows: number
  preview: Record<string, string>[]
  /** Full parsed rows kept in memory for sampling */
  rows: Record<string, string>[]
}

export interface AuditGenSample {
  headers: string[]
  rows: Record<string, string>[]
  sampled: number
  totalRows: number
  percent: number
  downloadName: string
}

export function formatNumber(n: number) {
  return Number(n).toLocaleString('en-IN')
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function resolveTargetN(totalRows: number, percent: number) {
  if (!totalRows) return 0
  return Math.max(1, Math.min(totalRows, Math.round((percent / 100) * totalRows)))
}

export function validateCsvFile(file: File | null): string {
  if (!file) return 'Please choose a file.'
  if (!file.name.toLowerCase().endsWith('.csv')) return 'Only .csv files are accepted.'
  if (file.size > 80 * 1024 * 1024) return 'File is larger than the 80 MB limit.'
  return ''
}

export function parseCsvFile(file: File): Promise<AuditGenMeta> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (full) => {
        const headers = full.meta.fields || []
        const rows = (full.data || []).filter((row) =>
          Object.values(row).some((v) => String(v ?? '').trim() !== '')
        )
        if (!rows.length) {
          reject(new Error('No data rows were found in this CSV.'))
          return
        }
        resolve({
          fileName: file.name,
          sizeBytes: file.size,
          headers,
          totalRows: rows.length,
          preview: rows.slice(0, 5),
          rows,
        })
      },
      error: () => reject(new Error('The CSV could not be read. Please check the file and try again.')),
    })
  })
}

/** Fisher–Yates sample without replacement */
export function sampleRows(
  meta: AuditGenMeta,
  percent: number
): AuditGenSample {
  const targetN = resolveTargetN(meta.totalRows, percent)
  const indices = Array.from({ length: meta.rows.length }, (_, i) => i)
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = indices[i]
    indices[i] = indices[j]
    indices[j] = tmp
  }
  const sampled = indices.slice(0, targetN).map((i) => meta.rows[i])
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const base = meta.fileName.replace(/\.csv$/i, '') || 'sample'
  return {
    headers: meta.headers,
    rows: sampled,
    sampled: sampled.length,
    totalRows: meta.totalRows,
    percent,
    downloadName: `${base}-auditgen-sample-${stamp}.csv`,
  }
}

export function exportSampleCsv(result: AuditGenSample) {
  if (!result.rows.length) return
  const csv = Papa.unparse({ fields: result.headers, data: result.rows })
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = result.downloadName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

const DISTRICTS = ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Rewa', 'Satna']
const SCHEMES = ['PM-JAY', 'Mukhyamantri', 'State Share', 'Empanelment']
const FACILITIES = ['DH', 'CHC', 'PHC', 'Medical College']
const STATUSES = ['Paid', 'Queried', 'Under review', 'Pre-auth']

export function buildDemoCsvFile(rowCount = 2480): File {
  const header = [
    'claim_id',
    'beneficiary_id',
    'district',
    'facility_type',
    'scheme',
    'package_code',
    'claimed_amount',
    'admission_date',
    'status',
  ]
  const lines = [header.join(',')]
  for (let i = 1; i <= rowCount; i += 1) {
    lines.push(
      [
        `CLM${String(i).padStart(6, '0')}`,
        `BEN${String(i).padStart(6, '0')}`,
        DISTRICTS[i % DISTRICTS.length],
        FACILITIES[i % FACILITIES.length],
        SCHEMES[i % SCHEMES.length],
        `PKG${(i % 40) + 1}`,
        String(5000 + (i % 50) * 1000),
        `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        STATUSES[i % STATUSES.length],
      ].join(',')
    )
  }
  return new File([lines.join('\n')], 'auditgen-demo-claims.csv', { type: 'text/csv' })
}
