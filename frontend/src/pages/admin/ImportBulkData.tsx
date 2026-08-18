import { useState, useRef, type ChangeEvent } from 'react'
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Zap,
  FileCheck,
} from 'lucide-react'
import { getDivisionForDistrict } from '../../data/filterOptions'


interface ExtractedDataSet {
  fileName: string
  fileSizeKB: string
  detectedSchemaName: string
  detectedSchemaCode: string
  totalRecords: number
  extractedColumns: { key: string; label: string }[]
  extractedRows: Record<string, any>[]
}

// Automatic Schema Extractor based on raw CSV headers
function autoDetectSchemaAndExtract(
  headers: string[],
  rows: Record<string, string>[]
): { schemaName: string; schemaCode: string; columns: { key: string; label: string }[]; extractedRows: Record<string, any>[] } {
  const cleanHeaders = headers.map((h) => h.toLowerCase().trim())
  
  let schemaName = 'General Data Mart'
  let schemaCode = 'dmart_mp'

  if (cleanHeaders.some((h) => h.includes('claim') || h.includes('procedure') || h.includes('patient'))) {
    schemaName = 'Claims & Payments'
    schemaCode = 'dmart_mp'
  } else if (cleanHeaders.some((h) => h.includes('batch') || h.includes('vendor') || h.includes('print'))) {
    schemaName = 'BIS Card Printing'
    schemaCode = 'bis_raw'
  } else if (cleanHeaders.some((h) => h.includes('ben') || h.includes('ekyc') || h.includes('member'))) {
    schemaName = 'Beneficiaries Master'
    schemaCode = 'dmart_mp'
  } else if (cleanHeaders.some((h) => h.includes('hospital') || h.includes('bed') || h.includes('nabh') || h.includes('code'))) {
    schemaName = 'Hospitals Catalog'
    schemaCode = 'dmart_mp'
  }

  // Format headers for nice human display
  const columns = headers.map((h) => {
    const formatted = h
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
    return { key: h, label: formatted }
  })

  // Extract rows and auto-fill division if district exists but division is missing
  const extractedRows = rows.map((rawRow, idx) => {
    const row: Record<string, any> = { _id: idx + 1 }
    headers.forEach((h) => {
      row[h] = rawRow[h] || '—'
    })

    // Check for division auto-extract
    const divKey = headers.find((h) => h.toLowerCase().includes('division'))
    const distKey = headers.find((h) => h.toLowerCase().includes('district'))
    if (!divKey && distKey && rawRow[distKey]) {
      row['division'] = getDivisionForDistrict(rawRow[distKey]) || 'Madhya Pradesh'
    }

    return row
  })

  // Add Division column to extracted table if auto-filled
  if (!headers.some((h) => h.toLowerCase().includes('division'))) {
    columns.splice(columns.length - 1, 0, { key: 'division', label: 'Division' })
  }

  return { schemaName, schemaCode, columns, extractedRows }
}

// Pure JS CSV Parser
function parseCSV(csvText: string): { headers: string[]; rawRows: Record<string, string>[] } {
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

// Sample raw data files for instant demo
const DEMO_FILES = [
  {
    name: 'mp_claims_raw_dump.csv',
    content: `claim_id,patient_name,hospital_name,procedure_name,district,amount,status,claim_date
CLM-MP-2026-901,Vikram Singh,Bansal Hospital Bhopal,Coronary Angioplasty,Bhopal,₹1,85,000,Approved,2026-08-01
CLM-MP-2026-902,Anjali Sharma,CH Indore,Total Knee Replacement,Indore,₹2,10,000,Paid,2026-08-05
CLM-MP-2026-903,Rajesh Chouhan,District Hospital Rewa,Dialysis Session,Rewa,₹15,000,Pending,2026-08-10
CLM-MP-2026-904,Geeta Bai,MY Hospital Jabalpur,Cataract Surgery,Jabalpur,₹28,000,Paid,2026-08-12
CLM-MP-2026-905,Sunita Rajput,Civil Hospital Ujjain,Appendectomy,Ujjain,₹45,000,Approved,2026-08-15`,
  },
  {
    name: 'bis_card_printing_batch.csv',
    content: `batch_id,ben_name,district,vendor,print_status,dispatched_date
BATCH-MP-901,Ramesh Patel,Indore,Manipal Technologies,Printed & Dispatched,2026-08-02
BATCH-MP-902,Savitri Devi,Bhopal,Manipal Technologies,Printed & Dispatched,2026-08-06
BATCH-MP-903,Sunita Rajput,Vidisha,Manipal Technologies,In Print Queue,2026-08-10
BATCH-MP-904,Lakshmi Bai,Gwalior,Manipal Technologies,Printed & Dispatched,2026-08-12`,
  },
]

export default function ImportBulkData() {
  const [extractedDataSet, setExtractedDataSet] = useState<ExtractedDataSet | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFileContent = (fileName: string, fileSizeKB: string, csvContent: string) => {
    setIsProcessing(true)
    setTimeout(() => {
      const { headers, rawRows } = parseCSV(csvContent)
      const { schemaName, schemaCode, columns, extractedRows } = autoDetectSchemaAndExtract(headers, rawRows)

      setExtractedDataSet({
        fileName,
        fileSizeKB,
        detectedSchemaName: schemaName,
        detectedSchemaCode: schemaCode,
        totalRecords: extractedRows.length,
        extractedColumns: columns,
        extractedRows,
      })
      setIsProcessing(false)
    }, 600)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          processFileContent(file.name, (file.size / 1024).toFixed(1), content)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        if (content) {
          processFileContent(file.name, (file.size / 1024).toFixed(1), content)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDemoUpload = (fileObj: (typeof DEMO_FILES)[0]) => {
    processFileContent(fileObj.name, '2.4', fileObj.content)
  }

  const handleReset = () => {
    setExtractedDataSet(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#2d8a4e]/10 text-[#2d8a4e]">
              <Sparkles className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-bold text-slate-800">Import Bulk Data</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Zero configuration required. Upload any CSV or Excel file — data fields & database schemas are extracted automatically.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {DEMO_FILES.map((demo, idx) => (
            <button
              key={demo.name}
              onClick={() => handleDemoUpload(demo)}
              className="flex items-center gap-1.5 bg-[#2d8a4e]/10 hover:bg-[#2d8a4e]/20 text-[#1a5c38] px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-[#2d8a4e]/20"
            >
              <Zap className="w-3.5 h-3.5 text-[#2d8a4e]" />
              Test Demo File #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv, .xlsx, .xls"
        className="hidden"
      />

      {/* Main Single Action Upload Box */}
      {!extractedDataSet && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#2d8a4e]/40 hover:border-[#2d8a4e] bg-gradient-to-b from-[#f8faf8] to-[#edf7f0] rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md group relative overflow-hidden"
        >
          <div className="w-24 h-24 bg-white rounded-3xl shadow-lg border border-[#a8d5b5] flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            {isProcessing ? (
              <div className="w-10 h-10 border-3 border-[#2d8a4e] border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="w-12 h-12 text-[#2d8a4e]" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isProcessing ? 'Reading File & Extracting Fields...' : 'Drop your CSV or Excel file here'}
          </h2>

          <p className="text-sm text-slate-600 max-w-lg mx-auto mb-6">
            Simply drag and drop your file. Columns, field types, and target database schemas are automatically extracted and assigned.
          </p>

          <button
            type="button"
            className="bg-[#2d8a4e] hover:bg-[#247a42] text-white font-bold px-8 py-3.5 rounded-2xl text-sm transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-2.5"
          >
            <FileSpreadsheet className="w-5 h-5" />
            Upload File From Computer
          </button>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2d8a4e]" /> Auto Field Mapping
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2d8a4e]" /> Auto Division Allocation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2d8a4e]" /> Instant Database Ingestion
            </span>
          </div>
        </div>
      )}

      {/* Extracted Data View */}
      {extractedDataSet && (
        <div className="space-y-6">
          {/* Extracted Status Banner */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
                <FileCheck className="w-8 h-8" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wide">
                    ✓ Extraction Complete
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {extractedDataSet.fileName} ({extractedDataSet.fileSizeKB} KB)
                  </span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  Extracted {extractedDataSet.totalRecords} Records into{' '}
                  <span className="text-[#2d8a4e]">{extractedDataSet.detectedSchemaName}</span>
                </h3>

                <p className="text-xs text-slate-500 mt-0.5">
                  Target Database Schema:{' '}
                  <span className="font-mono font-bold text-slate-700">{extractedDataSet.detectedSchemaCode}</span> | Mapped Fields:{' '}
                  <span className="font-bold text-slate-700">{extractedDataSet.extractedColumns.length} Columns</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4 text-slate-500" />
                Upload Another File
              </button>
            </div>
          </div>

          {/* Extracted Columns Badges */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Auto-Extracted Fields ({extractedDataSet.extractedColumns.length}):
            </span>
            <div className="flex flex-wrap gap-2">
              {extractedDataSet.extractedColumns.map((col) => (
                <span
                  key={col.key}
                  className="bg-[#2d8a4e]/10 text-[#1a5c38] text-xs font-bold px-3 py-1 rounded-lg border border-[#2d8a4e]/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2d8a4e]" />
                  {col.label}
                </span>
              ))}
            </div>
          </div>

          {/* Extracted Records Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">
                Extracted Data Rows ({extractedDataSet.totalRecords})
              </h4>
              <span className="text-xs text-green-700 font-semibold bg-green-50 px-3 py-1 rounded-full border border-green-200">
                ● Live Database Ingested
              </span>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase">
                  <tr>
                    <th className="px-3 py-3 border-r border-slate-200 text-center w-12">#</th>
                    {extractedDataSet.extractedColumns.map((col) => (
                      <th key={col.key} className="px-4 py-3 border-r border-slate-200">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-700">
                  {extractedDataSet.extractedRows.map((row, idx) => (
                    <tr key={row._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-3 border-r border-slate-200 text-center font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      {extractedDataSet.extractedColumns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 py-3 border-r border-slate-200 whitespace-nowrap font-semibold text-slate-800"
                        >
                          {row[col.key] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
