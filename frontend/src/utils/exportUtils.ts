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

// 3. Export Data & Reports to PDF (Print-to-PDF / PDF Window Export)
export function exportToPDF(
  title: string,
  subtitle: string,
  filename: string,
  data: Record<string, any>[],
  columns?: ColumnDef[]
) {
  if (!data || data.length === 0) return

  const docTitle = filename ? `${title} (${filename})` : title

  const cols =
    columns ||
    Object.keys(data[0]).map((k) => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }))

  const headersHtml = cols.map((c) => `<th>${c.label}</th>`).join('')
  const rowsHtml = data
    .map(
      (row) =>
        `<tr>${cols
          .map((c) => `<td>${row[c.key] ?? '—'}</td>`)
          .join('')}</tr>`
    )
    .join('')

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${docTitle}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; color: #1e293b; }
    .header { border-bottom: 2px solid #2d8a4e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: bold; color: #1a3a2e; margin: 0; }
    .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
    .meta { font-size: 11px; color: #94a3b8; text-align: right; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th { background-color: #f1f5f9; color: #334155; font-weight: 700; text-transform: uppercase; font-size: 10px; padding: 8px 10px; text-align: left; border: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background-color: #f8fafc; }
    .footer { margin-top: 20px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="title">${title}</div>
      <div class="subtitle">${subtitle || 'Ayushman Bharat PM-JAY — State Health Agency'}</div>
    </div>
    <div class="meta">
      <div>Generated: ${new Date().toLocaleString()}</div>
      <div>Records: ${data.length}</div>
    </div>
  </div>

  <table>
    <thead><tr>${headersHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="footer">
    <div>Ayushman MP Analytics Portal</div>
    <div>Confidential Document</div>
  </div>

  <script>
    window.onload = function() {
      window.print();
    }
  </script>
</body>
</html>`

  printWindow.document.write(html)
  printWindow.document.close()
}

// 4. Export Complete Page to PDF (Captures KPI Cards, SVG Graphs, and Tables)
export function exportFullPagePDF(title: string, subtitle?: string) {
  const mainEl = document.getElementById('dashboard-page-content') || document.querySelector('main')
  if (!mainEl) return

  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const styleSheets = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join('\n')
      } catch {
        return ''
      }
    })
    .join('\n')

  const contentHtml = mainEl.innerHTML

  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${title} — Full Dashboard Report</title>
  <style>
    ${styleSheets}
    @page { size: A4 landscape; margin: 10mm; }
    body { background-color: #ffffff !important; color: #0f172a !important; padding: 15px; font-family: system-ui, -apple-system, sans-serif; }
    .no-print, button, select, input, [role="button"] { display: none !important; }
    .print-header { border-bottom: 2px solid #2d8a4e; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
    .print-title { font-size: 22px; font-weight: bold; color: #1a5c38; margin: 0; }
    .print-subtitle { font-size: 13px; color: #475569; margin-top: 4px; }
    .print-meta { font-size: 11px; color: #64748b; text-align: right; }
    .print-footer { margin-top: 30px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; display: flex; justify-content: space-between; }
    svg { max-width: 100% !important; height: auto !important; overflow: visible !important; }
  </style>
</head>
<body>
  <div class="print-header">
    <div>
      <div class="print-title">Ayushman Bharat PM-JAY — ${title}</div>
      <div class="print-subtitle">${subtitle || 'State Health Agency Analytics Portal Report'}</div>
    </div>
    <div class="print-meta">
      <div>Report Generated: ${new Date().toLocaleString('en-IN')}</div>
      <div>Full Page PDF Document</div>
    </div>
  </div>

  <div class="print-body">
    ${contentHtml}
  </div>

  <div class="print-footer">
    <div>Generated from Ayushman MP Analytics Portal</div>
    <div>Confidential Document</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    }
  </script>
</body>
</html>`

  printWindow.document.write(fullHtml)
  printWindow.document.close()
}

