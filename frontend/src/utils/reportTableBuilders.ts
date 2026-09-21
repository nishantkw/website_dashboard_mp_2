import type { TableColumn } from '../types'
import { schemaTableColumns } from './schemaColumns'

export interface ReportTableBlock {
  title: string
  columns: TableColumn[]
  data: Record<string, string | number>[]
}

type ApiRecord = Record<string, unknown>

export function pushSchemaTable(
  out: ReportTableBlock[],
  source: 'api' | 'mock' | 'offline',
  filterRows: (rows: Record<string, string | number>[]) => Record<string, string | number>[],
  opts: {
    title: string
    rows?: Record<string, string | number>[]
    schemaKeys?: string[]
    demoColumns: TableColumn[]
    preferredFirst?: string[]
  }
) {
  const rows = opts.rows ?? []
  if (source !== 'api' && !rows.length) return
  out.push({
    title: opts.title,
    columns: schemaTableColumns({
      source,
      schemaKeys: opts.schemaKeys,
      rows,
      preferredFirst: opts.preferredFirst ?? opts.demoColumns.map((c) => c.key),
      demoColumns: opts.demoColumns,
    }),
    data: filterRows(rows),
  })
}

export function buildBisCardPrintingTables(
  apiData: ApiRecord,
  source: 'api' | 'mock' | 'offline',
  reportTables: ReportTableBlock[],
  filterRows: (rows: Record<string, string | number>[]) => Record<string, string | number>[]
): ReportTableBlock[] {
  if (source !== 'api') return reportTables.map((t) => ({ ...t, data: [] }))
  const demo = reportTables[0]?.columns ?? []
  const out: ReportTableBlock[] = []
  pushSchemaTable(out, source, filterRows, {
    title: String(apiData.schema ?? reportTables[0]?.title ?? 'Card Records'),
    rows: (apiData.table as Record<string, string | number>[]) ?? [],
    schemaKeys: apiData.columns as string[] | undefined,
    demoColumns: demo,
  })
  return out.length ? out : reportTables.map((t) => ({ ...t, data: [] }))
}

export function buildBisCardPrintDataTables(
  apiData: ApiRecord,
  source: 'api' | 'mock' | 'offline',
  reportTables: ReportTableBlock[],
  filterRows: (rows: Record<string, string | number>[]) => Record<string, string | number>[]
): ReportTableBlock[] {
  if (source !== 'api') return reportTables.map((t) => ({ ...t, data: [] }))
  const demo = reportTables[0]?.columns ?? []
  const out: ReportTableBlock[] = []
  const batches: Array<{ title: string; rows?: Record<string, string | number>[]; cols?: string[]; schema?: string }> = [
    { title: String(apiData.augSchema ?? 'Aug 2025 Batch'), rows: apiData.augTable as Record<string, string | number>[], cols: apiData.augColumns as string[], schema: apiData.augSchema as string },
    { title: String(apiData.vvsSchema ?? 'VVS May 2025'), rows: apiData.vvsTable as Record<string, string | number>[], cols: apiData.vvsColumns as string[], schema: apiData.vvsSchema as string },
    { title: String(apiData.tempSchema ?? 'Temp e-KYC Jul 2026'), rows: apiData.tempTable as Record<string, string | number>[], cols: apiData.tempColumns as string[], schema: apiData.tempSchema as string },
    { title: String(apiData.leftoverSchema ?? 'Leftover Cards (09-Aug-2026)'), rows: apiData.leftoverTable as Record<string, string | number>[], cols: apiData.leftoverColumns as string[], schema: apiData.leftoverSchema as string },
  ]
  for (const batch of batches) {
    if (!batch.rows?.length && source !== 'api') continue
    pushSchemaTable(out, source, filterRows, {
      title: batch.title,
      rows: batch.rows ?? [],
      schemaKeys: batch.cols,
      demoColumns: demo,
    })
  }
  return out.length ? out : reportTables.map((t) => ({ ...t, data: [] }))
}

export function buildBisPrintDedupTables(
  apiData: ApiRecord,
  source: 'api' | 'mock' | 'offline',
  reportTables: ReportTableBlock[],
  filterRows: (rows: Record<string, string | number>[]) => Record<string, string | number>[]
): ReportTableBlock[] {
  if (source !== 'api') return reportTables.map((t) => ({ ...t, data: [] }))
  const demo = reportTables[0]?.columns ?? []
  const out: ReportTableBlock[] = []
  pushSchemaTable(out, source, filterRows, {
    title: String(apiData.batchASchema ?? reportTables[0]?.title ?? 'Already Printed (29-Jun)'),
    rows: (apiData.batchATable as Record<string, string | number>[]) ?? [],
    schemaKeys: apiData.batchAColumns as string[] | undefined,
    demoColumns: demo,
  })
  pushSchemaTable(out, source, filterRows, {
    title: String(apiData.batchBSchema ?? reportTables[1]?.title ?? 'Already Printed (09-Aug)'),
    rows: (apiData.batchBTable as Record<string, string | number>[]) ?? [],
    schemaKeys: apiData.batchBColumns as string[] | undefined,
    demoColumns: demo,
  })
  return out.length ? out : reportTables.map((t) => ({ ...t, data: [] }))
}

export function buildUmpUsersTables(
  apiData: ApiRecord,
  source: 'api' | 'mock' | 'offline',
  reportTables: ReportTableBlock[],
  filterRows: (rows: Record<string, string | number>[]) => Record<string, string | number>[]
): ReportTableBlock[] {
  if (source !== 'api') return reportTables.map((t) => ({ ...t, data: [] }))
  const demo = reportTables[0]?.columns ?? []
  const out: ReportTableBlock[] = []
  pushSchemaTable(out, source, filterRows, {
    title: String(apiData.schema ?? reportTables[0]?.title ?? 'User Records'),
    rows: (apiData.table as Record<string, string | number>[]) ?? [],
    schemaKeys: apiData.columns as string[] | undefined,
    demoColumns: demo,
  })
  return out.length ? out : reportTables.map((t) => ({ ...t, data: [] }))
}
