/** Parse CSV text into headers and row objects keyed by header. */
export function parseCSV(csvText: string): { headers: string[]; rawRows: Record<string, string>[] } {
  const lines = csvText.split(/\r\n|\n/).filter((l) => l.trim() !== '')
  if (lines.length === 0) return { headers: [], rawRows: [] }

  const splitCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  const rawHeaders = splitCSVLine(lines[0])
  const headers = rawHeaders.map((h) => h.replace(/^["']|["']$/g, '').trim())

  const rawRows: Record<string, string>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i])
    if (values.length === 0 || (values.length === 1 && !values[0])) continue
    const rowObj: Record<string, string> = {}
    headers.forEach((header, idx) => {
      rowObj[header] = values[idx]?.replace(/^["']|["']$/g, '').trim() || ''
    })
    rawRows.push(rowObj)
  }

  return { headers, rawRows }
}

/** Apply CSV header → DB column mapping to produce import-ready rows. */
export function applyMapping(
  rawRows: Record<string, string>[],
  mapping: Record<string, string>
): Record<string, string>[] {
  return rawRows.map((raw) => {
    const out: Record<string, string> = {}
    for (const [csvHeader, dbCol] of Object.entries(mapping)) {
      if (!dbCol) continue
      if (raw[csvHeader] !== undefined) out[dbCol] = raw[csvHeader]
    }
    return out
  })
}

export function labelizeColumn(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
