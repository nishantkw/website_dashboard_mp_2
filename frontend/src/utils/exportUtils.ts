export interface ColumnDef {
  key: string
  label: string
}

export interface ExportSheet {
  name: string
  rows: Record<string, any>[]
  columns?: ColumnDef[]
}

function resolveColumns(data: Record<string, any>[], columns?: ColumnDef[]): ColumnDef[] {
  if (columns?.length) return columns
  if (!data.length) return []
  return Object.keys(data[0]).map((k) => ({
    key: k,
    label: k === 'name' ? 'Category' : k === 'value' ? 'Count' : k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }))
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 1. Export Data to CSV
export function exportToCSV(
  filename: string,
  data: Record<string, any>[],
  columns?: ColumnDef[]
) {
  exportSheetsToCSV(filename, [{ name: 'Data', rows: data, columns }])
}

/** One CSV with every dashboard card/graph as a labeled section. */
export function exportSheetsToCSV(filename: string, sheets: ExportSheet[]) {
  const blocks = sheets.filter((s) => s.rows?.length)
  if (!blocks.length) return

  const parts: string[] = []
  for (const sheet of blocks) {
    const cols = resolveColumns(sheet.rows, sheet.columns)
    if (!cols.length) continue
    parts.push(`"${String(sheet.name).replace(/"/g, '""')}"`)
    parts.push(cols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(','))
    for (const row of sheet.rows) {
      parts.push(
        cols
          .map((c) => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
    }
    parts.push('')
  }

  const csvContent = '\uFEFF' + parts.join('\r\n')
  downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), filename.endsWith('.csv') ? filename : `${filename}.csv`)
}

export async function exportToExcel(
  filename: string,
  data: Record<string, any>[],
  columns?: ColumnDef[]
) {
  const { writeExcelFile } = await import('./exportExcelXlsx')
  await writeExcelFile(filename, [{ name: 'Sheet1', rows: data, columns }])
}

export async function exportSheetsToExcel(filename: string, sheets: ExportSheet[]) {
  const { writeExcelFile } = await import('./exportExcelXlsx')
  await writeExcelFile(filename, sheets)
}

export async function exportSheetsToExcelWithVisuals(
  filename: string,
  _title: string,
  sheets: ExportSheet[],
  visuals: { title: string; dataUrl: string }[]
) {
  const { writeExcelFile } = await import('./exportExcelXlsx')
  await writeExcelFile(filename, sheets, visuals)
}

/** Soft confirm before generating a large downloadable PDF. */
export const PDF_CONFIRM_ROWS = 10_000
/**
 * Above this, a browser-built PDF is too large / slow.
 * Full dataset is still available via CSV / Excel.
 */
export const PDF_MAX_ROWS = 75_000

function safePdfFilename(filename: string) {
  const base = (filename || 'export').replace(/\.pdf$/i, '').replace(/[^\w.\-]+/g, '_')
  return base.endsWith('.pdf') ? base : `${base}.pdf`
}

function cellText(value: unknown) {
  if (value == null) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

// 3. Export Data & Reports to PDF — downloads a .pdf with all matching rows
export async function exportToPDF(
  title: string,
  subtitle: string,
  filename: string,
  data: Record<string, any>[],
  columns?: ColumnDef[]
): Promise<'ok' | 'blocked' | 'empty'> {
  if (!data || data.length === 0) return 'empty'

  if (data.length > PDF_MAX_ROWS) {
    window.alert(
      `This report has ${data.length.toLocaleString()} rows. A PDF of that size is too large for the browser.\n\n` +
        `Downloading CSV with all ${data.length.toLocaleString()} rows instead — use CSV or Excel for full million-row exports.`
    )
    exportToCSV(filename, data, columns)
    return 'blocked'
  }

  if (data.length >= PDF_CONFIRM_ROWS) {
    const ok = window.confirm(
      `Download PDF with all ${data.length.toLocaleString()} matching rows?\n\n` +
        `This is every row in the report (not only the current page). Large files can take a minute to build.`
    )
    if (!ok) return 'blocked'
  }

  const cols = resolveColumns(data, columns)
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const landscape = cols.length > 6
  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  })

  const marginX = 28
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(26, 92, 56)
  doc.text(title || 'Report', marginX, 32)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  const sub = subtitle || 'Ayushman Bharat PM-JAY — State Health Agency'
  doc.text(doc.splitTextToSize(sub, pageW - marginX * 2), marginX, 48)
  doc.text(
    `Generated: ${new Date().toLocaleString()}  ·  All matching records: ${data.length.toLocaleString()}`,
    marginX,
    64
  )

  const body: string[][] = []
  const yieldEvery = 2_000
  for (let i = 0; i < data.length; i += 1) {
    body.push(cols.map((c) => cellText(data[i][c.key])))
    if (i > 0 && i % yieldEvery === 0) {
      await new Promise((r) => setTimeout(r, 0))
    }
  }

  autoTable(doc, {
    head: [cols.map((c) => c.label)],
    body,
    startY: 76,
    margin: { left: marginX, right: marginX, top: 36, bottom: 36 },
    styles: {
      fontSize: cols.length > 10 ? 6.5 : 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'top',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: cols.length > 10 ? 6.5 : 7.5,
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (hook) => {
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFontSize(8)
      doc.setTextColor(148, 163, 184)
      doc.text(
        `Ayushman MP Analytics Portal — ${data.length.toLocaleString()} rows`,
        marginX,
        pageH - 16
      )
      doc.text(`Page ${hook.pageNumber}`, pageW - marginX, pageH - 16, { align: 'right' })
    },
  })

  const outName = safePdfFilename(filename)
  doc.save(outName)
  return 'ok'
}

function drawFullPageChrome(
  doc: import('jspdf').jsPDF,
  title: string,
  subtitle: string,
  pageNumber: number,
  totalPages: number
) {
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 28

  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageW, 56, 'F')
  doc.setDrawColor(45, 138, 78)
  doc.setLineWidth(1.5)
  doc.line(margin, 52, pageW - margin, 52)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(26, 92, 56)
  doc.text(`Ayushman Bharat PM-JAY — ${title}`, margin, 24)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(doc.splitTextToSize(subtitle || 'State Health Agency Analytics Portal Report', pageW - margin * 2 - 160), margin, 40)

  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(new Date().toLocaleString('en-IN'), pageW - margin, 24, { align: 'right' })
  doc.text('Confidential', pageW - margin, 38, { align: 'right' })

  doc.setDrawColor(226, 232, 240)
  doc.setLineWidth(0.6)
  doc.line(margin, pageH - 24, pageW - margin, pageH - 24)
  doc.setFontSize(8)
  doc.setTextColor(148, 163, 184)
  doc.text('Generated from Ayushman MP Analytics Portal', margin, pageH - 12)
  doc.text(`Page ${pageNumber} of ${totalPages}`, pageW - margin, pageH - 12, { align: 'right' })
}

// 4. Full dashboard PDF — snapshot KPIs/charts as images so layout never overlaps
export async function exportFullPagePDF(title: string, subtitle?: string) {
  const { captureExportVisuals } = await import('./chartCapture')
  const visuals = await captureExportVisuals()

  if (!visuals.length) {
    window.alert('Nothing to export as PDF yet. Wait for charts to load, then try again.')
    return
  }

  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 28
  const headerH = 64
  const footerH = 36
  const contentTop = headerH
  const contentBottom = pageH - footerH
  const contentH = contentBottom - contentTop
  const contentW = pageW - margin * 2
  const totalPages = visuals.length

  visuals.forEach((visual, index) => {
    if (index > 0) doc.addPage()
    drawFullPageChrome(doc, title, subtitle || '', index + 1, totalPages)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42)
    doc.text(visual.title || `Section ${index + 1}`, margin, contentTop + 14)

    const imgTop = contentTop + 24
    const maxImgH = contentH - 28
    try {
      const props = doc.getImageProperties(visual.dataUrl)
      let drawW = contentW
      let drawH = (props.height * drawW) / props.width
      if (drawH > maxImgH) {
        drawH = maxImgH
        drawW = (props.width * drawH) / props.height
      }
      const x = margin + (contentW - drawW) / 2
      doc.addImage(visual.dataUrl, 'PNG', x, imgTop, drawW, drawH, undefined, 'FAST')
    } catch (err) {
      console.warn(`[export] could not place "${visual.title}" in PDF`, err)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(185, 28, 28)
      doc.text('Chart could not be rendered in this PDF.', margin, imgTop + 20)
    }
  })

  doc.save(safePdfFilename(`${title || 'dashboard'}_full_report`))
}


