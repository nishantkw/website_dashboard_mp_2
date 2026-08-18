export interface ColumnDef {
  key: string
  label: string
}

// 1. Export Data to CSV
export function exportToCSV(
  filename: string,
  data: Record<string, any>[],
  columns?: ColumnDef[]
) {
  if (!data || data.length === 0) return

  const cols =
    columns ||
    Object.keys(data[0]).map((k) => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }))

  const headers = cols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',')
  const rows = data.map((row) =>
    cols
      .map((c) => {
        const val = row[c.key] ?? ''
        return `"${String(val).replace(/"/g, '""')}"`
      })
      .join(',')
  )

  const csvContent = '\uFEFF' + [headers, ...rows].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 2. Export Data to Excel (.xls XML Format)
export function exportToExcel(
  filename: string,
  data: Record<string, any>[],
  columns?: ColumnDef[]
) {
  if (!data || data.length === 0) return

  const cols =
    columns ||
    Object.keys(data[0]).map((k) => ({ key: k, label: k.replace(/_/g, ' ').toUpperCase() }))

  const headerXml = cols.map((c) => `<Cell><Data ss:Type="String">${c.label}</Data></Cell>`).join('')
  const rowsXml = data
    .map((row) => {
      const cells = cols
        .map((c) => {
          const val = row[c.key] ?? ''
          const isNum = typeof val === 'number' && !Number.isNaN(val)
          return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${String(val)}</Data></Cell>`
        })
        .join('')
      return `<Row>${cells}</Row>`
    })
    .join('')

  const excelXml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Worksheet ss:Name="Sheet1">
    <Table>
      <Row>${headerXml}</Row>
      ${rowsXml}
    </Table>
  </Worksheet>
</Workbook>`

  const blob = new Blob([excelXml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename.endsWith('.xls') ? filename : `${filename}.xls`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
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

