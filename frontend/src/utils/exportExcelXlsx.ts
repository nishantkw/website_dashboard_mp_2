import ExcelJS from 'exceljs'
import type { ColumnDef, ExportSheet } from './exportUtils'

function sanitizeSheetName(name: string, used: Set<string>) {
  let base = String(name || 'Sheet')
    .replace(/[:\\/?*[\]]/g, ' ')
    .trim()
    .slice(0, 31)
  if (!base) base = 'Sheet'
  let next = base
  let i = 2
  while (used.has(next.toLowerCase())) {
    const suffix = ` ${i}`
    next = `${base.slice(0, 31 - suffix.length)}${suffix}`
    i += 1
  }
  used.add(next.toLowerCase())
  return next
}

function resolveColumns(data: Record<string, unknown>[], columns?: ColumnDef[]): ColumnDef[] {
  if (columns?.length) return columns
  if (!data.length) return []
  return Object.keys(data[0]).map((k) => ({
    key: k,
    label: k === 'name' ? 'Category' : k === 'value' ? 'Count' : k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
}

function xlsxFilename(filename: string) {
  return `${String(filename).replace(/\.(xls|xlsx|csv)$/i, '')}.xlsx`
}

function downloadXlsx(buffer: ArrayBuffer | Uint8Array, filename: string) {
  const src = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const copy = new ArrayBuffer(src.byteLength)
  new Uint8Array(copy).set(src)
  const blob = new Blob([copy], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = xlsxFilename(filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function dataUrlToBase64(dataUrl: string) {
  const marker = 'base64,'
  const i = dataUrl.indexOf(marker)
  return i >= 0 ? dataUrl.slice(i + marker.length) : dataUrl
}

function writeTable(ws: ExcelJS.Worksheet, sheet: ExportSheet, startRow: number) {
  const cols = resolveColumns(sheet.rows, sheet.columns)
  if (!cols.length) return
  cols.forEach((col, i) => {
    const cell = ws.getCell(startRow, i + 1)
    cell.value = col.label
    cell.font = { bold: true, color: { argb: 'FF1A5C38' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF7F0' } }
  })
  sheet.rows.forEach((row, r) => {
    cols.forEach((col, i) => {
      const raw = row[col.key]
      const cell = ws.getCell(startRow + 1 + r, i + 1)
      if (typeof raw === 'number' && Number.isFinite(raw)) cell.value = raw
      else if (raw == null || raw === '') cell.value = ''
      else {
        const n = Number(raw)
        cell.value = String(raw).trim() !== '' && Number.isFinite(n) && String(raw).trim() === String(n) ? n : String(raw)
      }
    })
  })
  cols.forEach((_, i) => {
    ws.getColumn(i + 1).width = 22
  })
}

async function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const maxW = 720
      const w = img.width / 2 || img.width
      const h = img.height / 2 || img.height
      const scale = w > maxW ? maxW / w : 1
      resolve({ width: Math.max(120, w * scale), height: Math.max(80, h * scale) })
    }
    img.onerror = () => reject(new Error('Could not read chart image'))
    img.src = dataUrl
  })
}

async function buildWorkbook(
  sheets: ExportSheet[],
  visuals: { title: string; dataUrl: string }[] = []
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'PM-JAY Analytics Portal'
  wb.created = new Date()
  const used = new Set<string>()
  const claimed = new Set<number>()

  const addDataSheet = (name: string, sheet: ExportSheet, startRow: number, ws?: ExcelJS.Worksheet) => {
    const worksheet = ws ?? wb.addWorksheet(sanitizeSheetName(name, used))
    writeTable(worksheet, sheet, startRow)
    return worksheet
  }

  for (const visual of visuals) {
    const sheetIdx = sheets.findIndex(
      (s, i) => !claimed.has(i) && s.name.toLowerCase() === visual.title.toLowerCase()
    )
    if (sheetIdx >= 0) claimed.add(sheetIdx)
    const dataSheet = sheetIdx >= 0 ? sheets[sheetIdx] : undefined
    const ws = wb.addWorksheet(sanitizeSheetName(visual.title, used))
    ws.getCell(1, 1).value = visual.title
    ws.getCell(1, 1).font = { bold: true, size: 14, color: { argb: 'FF1A5C38' } }

    try {
      const size = await imageSize(visual.dataUrl)
      const imageId = wb.addImage({
        base64: dataUrlToBase64(visual.dataUrl),
        extension: 'png',
      })
      ws.addImage(imageId, {
        tl: { col: 0, row: 1.2 },
        ext: { width: size.width, height: size.height },
      })
      const tableStart = Math.max(16, Math.ceil(size.height / 18) + 4)
      if (dataSheet?.rows?.length) writeTable(ws, dataSheet, tableStart)
    } catch {
      if (dataSheet?.rows?.length) writeTable(ws, dataSheet, 3)
    }
  }

  for (let i = 0; i < sheets.length; i++) {
    if (claimed.has(i) || !sheets[i].rows?.length) continue
    addDataSheet(sheets[i].name, sheets[i], 1)
  }

  if (!wb.worksheets.length) {
    addDataSheet('Sheet1', { name: 'Sheet1', rows: [{ Note: 'No data' }] }, 1)
  }

  return wb.xlsx.writeBuffer()
}

export async function writeExcelFile(
  filename: string,
  sheets: ExportSheet[],
  visuals: { title: string; dataUrl: string }[] = []
) {
  const blocks = sheets.filter((s) => s.rows?.length)
  if (!blocks.length && !visuals.length) return
  const buffer = await buildWorkbook(blocks.length ? blocks : sheets, visuals)
  downloadXlsx(buffer as ArrayBuffer, filename)
}
