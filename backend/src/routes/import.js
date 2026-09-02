import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { Router } from 'express'
import multer from 'multer'
import { query } from '../db/pool.js'
import {
  getImportTables,
  getImportTable,
  resolveImportTable,
  getTablesByModule,
  validateMappedRows,
  suggestMapping,
  suggestBestTable,
} from '../utils/schemaRegistry.js'
import { parseSpreadsheetBuffer, applyMapping } from '../utils/fileParse.js'
import { insertMappedRows } from '../utils/importInsert.js'
import { serializeRows } from '../utils/serialize.js'
import { assertSafeIdent } from '../utils/importRegistryCore.js'

const router = Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_ROOT = path.join(__dirname, '../../uploads')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const name = (file.originalname || '').toLowerCase()
    if (/\.(csv|txt|xlsx|xls|xlsm)$/.test(name)) cb(null, true)
    else cb(new Error('Only CSV and Excel files (.csv, .xlsx, .xls) are allowed'))
  },
})

function ensureUploadRoot() {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true })
}

function previewRows(rows, limit = 80) {
  return rows.slice(0, limit)
}

async function loadExtractedRows(row) {
  if (row.stored_path && fs.existsSync(row.stored_path)) {
    const parsed = parseSpreadsheetBuffer(fs.readFileSync(row.stored_path), row.file_name || row.stored_path)
    if (row.extract_path) fs.writeFileSync(row.extract_path, JSON.stringify(parsed.rows))
    try {
      fs.writeFileSync(
        path.join(path.dirname(row.stored_path), 'meta.json'),
        JSON.stringify({
          fileDuplicates: parsed.fileDuplicates || 0,
          duplicateReport: parsed.duplicateReport || null,
        })
      )
    } catch {
      /* ignore */
    }
    row._fileDuplicates = parsed.fileDuplicates || 0
    row._duplicateReport = parsed.duplicateReport || null
    if (parsed.rows.length !== Number(row.row_count)) {
      await query(
        `UPDATE app_auth.import_uploads
         SET row_count = $2, headers = $3::jsonb, preview = $4::jsonb
         WHERE id = $1`,
        [row.id, parsed.rows.length, JSON.stringify(parsed.headers), JSON.stringify(previewRows(parsed.rows))]
      )
      row.row_count = parsed.rows.length
      row.headers = parsed.headers
      row.preview = previewRows(parsed.rows)
    }
    return parsed.rows
  }
  if (row.extract_path && fs.existsSync(row.extract_path)) {
    return JSON.parse(fs.readFileSync(row.extract_path, 'utf8'))
  }
  return []
}

function readCachedExtract(row) {
  if (row.extract_path && fs.existsSync(row.extract_path)) {
    return JSON.parse(fs.readFileSync(row.extract_path, 'utf8'))
  }
  return []
}

function isImportedStatus(status) {
  return status === 'imported' || status === 'imported_with_errors'
}

function fileStem(fileName) {
  const raw = String(fileName || '').trim()
  return raw.replace(/\.[^.\\/]+$/, '') || raw
}

function uploadDir(row) {
  if (row.stored_path) return path.dirname(row.stored_path)
  if (row.extract_path) return path.dirname(row.extract_path)
  return path.join(UPLOAD_ROOT, String(row.id))
}

function filesStillOnDisk(row) {
  const dir = uploadDir(row)
  if (row.stored_path && fs.existsSync(row.stored_path)) return true
  if (row.extract_path && fs.existsSync(row.extract_path)) return true
  return fs.existsSync(dir)
}

function purgeUploadFiles(row) {
  fs.rmSync(uploadDir(row), { recursive: true, force: true })
}

async function markFilesPurged(id) {
  try {
    await query(
      `UPDATE app_auth.import_uploads
       SET stored_path = NULL, extract_path = NULL, file_size = 0
       WHERE id = $1`,
      [id]
    )
  } catch {
    await query(
      `UPDATE app_auth.import_uploads
       SET stored_path = '', extract_path = '', file_size = 0
       WHERE id = $1`,
      [id]
    )
  }
}

async function purgeImportedUpload(row) {
  if (!row || !isImportedStatus(row.status) || !filesStillOnDisk(row)) return false
  try {
    purgeUploadFiles(row)
    await markFilesPurged(row.id)
    row.stored_path = null
    row.extract_path = null
    row.file_size = 0
    return true
  } catch (err) {
    console.warn(`[import] could not purge files for ${row.id}: ${err.message}`)
    return false
  }
}

function liveColumnNames(tableDef) {
  return (tableDef?.columns || []).map((c) => c.name).filter((name) => {
    try {
      assertSafeIdent(name, 'column')
      return true
    } catch {
      return false
    }
  })
}

async function loadLiveTablePage(tableDef, queryParams = {}) {
  assertSafeIdent(tableDef.schema, 'schema')
  assertSafeIdent(tableDef.table, 'table')
  const offset = Math.max(0, Number(queryParams.offset || 0))
  const limit = Math.min(200, Math.max(1, Number(queryParams.limit || 50)))
  const headers = liveColumnNames(tableDef)
  const params = []
  const where = []

  const hospKey = findExtractHeader(headers, ['hosp_id', 'hospital_id', 'hospitalid'])
  const facKey = findExtractHeader(headers, ['facility_id', 'facilityid'])
  const hospId = String(queryParams.hosp_id || queryParams.hospId || '').trim()
  const facilityId = String(queryParams.facility_id || queryParams.facilityId || '').trim()
  const search = String(queryParams.search || '').trim()

  if (hospId && hospKey) {
    params.push(hospId)
    where.push(`${hospKey}::text = $${params.length}`)
  }
  if (facilityId && facKey) {
    params.push(facilityId)
    where.push(`${facKey}::text = $${params.length}`)
  }
  if (search) {
    const searchCols = headers.slice(0, 16)
    const parts = searchCols.map((col) => {
      params.push(`%${search}%`)
      return `${col}::text ILIKE $${params.length}`
    })
    if (parts.length) where.push(`(${parts.join(' OR ')})`)
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const fromSql = `${tableDef.schema}.${tableDef.table}`
  const countRes = await query(`SELECT COUNT(*)::int AS n FROM ${fromSql} ${whereSql}`, params)
  const total = countRes.rows[0]?.n || 0
  params.push(limit, offset)
  const dataRes = await query(
    `SELECT * FROM ${fromSql} ${whereSql} ORDER BY 1 LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  )
  return {
    headers: dataRes.rows[0] ? Object.keys(dataRes.rows[0]) : headers,
    total,
    fileTotal: total,
    offset,
    limit,
    rows: serializeRows(dataRes.rows),
  }
}

async function loadLiveTableFilters(tableDef) {
  assertSafeIdent(tableDef.schema, 'schema')
  assertSafeIdent(tableDef.table, 'table')
  const headers = liveColumnNames(tableDef)
  const hospKey = findExtractHeader(headers, ['hosp_id', 'hospital_id', 'hospitalid'])
  const facKey = findExtractHeader(headers, ['facility_id', 'facilityid'])
  const fromSql = `${tableDef.schema}.${tableDef.table}`
  const distinct = async (col) => {
    if (!col) return []
    const { rows } = await query(
      `SELECT DISTINCT ${col}::text AS v FROM ${fromSql} WHERE ${col} IS NOT NULL AND btrim(${col}::text) <> '' ORDER BY 1 LIMIT 400`
    )
    return rows.map((r) => String(r.v).trim()).filter(Boolean)
  }
  return {
    hospIdHeader: hospKey,
    facilityIdHeader: facKey,
    hospIds: await distinct(hospKey),
    facilityIds: await distinct(facKey),
  }
}

function normalizeHeaderName(h) {
  return String(h || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function findExtractHeader(headers, aliases) {
  const wanted = aliases.map(normalizeHeaderName)
  return (headers || []).find((h) => wanted.includes(normalizeHeaderName(h))) || null
}

function distinctFieldValues(rows, key) {
  if (!key) return []
  const seen = new Set()
  for (const row of rows) {
    const v = String(row?.[key] ?? '').trim()
    if (v) seen.add(v)
  }
  return [...seen].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function filterExtractRows(rows, headers, query = {}) {
  const hospKey = findExtractHeader(headers, ['hosp_id', 'hospital_id', 'hospitalid'])
  const facKey = findExtractHeader(headers, ['facility_id', 'facilityid'])
  const search = String(query.search || '').trim().toLowerCase()
  const hospId = String(query.hosp_id || query.hospId || '').trim()
  const facilityId = String(query.facility_id || query.facilityId || '').trim()

  if (!search && !hospId && !facilityId) return rows

  return rows.filter((row) => {
    if (hospId && hospKey && String(row[hospKey] ?? '').trim() !== hospId) return false
    if (facilityId && facKey && String(row[facKey] ?? '').trim() !== facilityId) return false
    if (search) {
      const hay = Object.values(row || {})
        .map((v) => String(v ?? ''))
        .join(' ')
        .toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

function rankingPayload(ranked) {
  return ranked.map((r) => ({
    id: r.table.id,
    label: r.table.label,
    mapped: r.mapped,
    columnCount: r.table.columnCount,
  }))
}

async function saveUploadRecord(meta) {
  await query(
    `INSERT INTO app_auth.import_uploads (
      id, file_name, file_size, mime_type, stored_path, extract_path,
      table_id, suggested_table_id, headers, mapping, row_count, preview, status
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13)`,
    [
      meta.id,
      meta.fileName,
      meta.fileSize,
      meta.mimeType,
      meta.storedPath,
      meta.extractPath,
      meta.tableId,
      meta.suggestedTableId,
      JSON.stringify(meta.headers),
      JSON.stringify(meta.mapping),
      meta.rowCount,
      JSON.stringify(meta.preview),
      'parsed',
    ]
  )
}

async function getUpload(id) {
  const { rows } = await query(`SELECT * FROM app_auth.import_uploads WHERE id = $1`, [id])
  return rows[0] || null
}

function readSidecarMeta(row) {
  try {
    const base = row.stored_path || row.extract_path
    if (!base) return {}
    const p = path.join(path.dirname(base), 'meta.json')
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'))
  } catch {
    /* ignore */
  }
  return {}
}

function serializeUpload(row, extra = {}) {
  const meta = readSidecarMeta(row)
  const imported = isImportedStatus(row.status)
  const onDisk = filesStillOnDisk(row)
  return {
    id: row.id,
    fileName: row.file_name,
    displayName: fileStem(row.file_name),
    fileSize: Number(row.file_size || 0),
    mimeType: row.mime_type,
    tableId: row.table_id,
    suggestedTableId: row.suggested_table_id,
    headers: row.headers,
    mapping: row.mapping,
    rowCount: row.row_count,
    preview: row.preview,
    fileDuplicates: extra.fileDuplicates ?? meta.fileDuplicates ?? 0,
    duplicateReport: extra.duplicateReport ?? meta.duplicateReport ?? null,
    status: row.status,
    importMode: row.import_mode,
    inserted: row.inserted,
    skipped: row.skipped,
    importErrors: row.import_errors,
    importedAt: row.imported_at,
    createdAt: row.created_at,
    source: imported && !onDisk ? 'database' : 'file',
    filesPurged: imported && !onDisk,
    ...extra,
  }
}

router.get('/tables', (_req, res) => {
  try {
    const tables = getImportTables()
    const byModule = getTablesByModule()
    res.json({ tables, byModule, total: tables.length })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/tables/:tableId', (req, res) => {
  try {
    const table = getImportTable(req.params.tableId)
    if (!table) return res.status(404).json({ error: 'Table not found' })
    res.json({ table })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/suggest-mapping', (req, res) => {
  try {
    const { tableId, headers } = req.body || {}
    const table = getImportTable(tableId)
    if (!table) return res.status(404).json({ error: 'Table not found' })
    if (!Array.isArray(headers)) return res.status(400).json({ error: 'headers array required' })
    const ranked = suggestBestTable(headers)
    res.json({
      mapping: suggestMapping(headers, table),
      tableId: table.id,
      suggestions: rankingPayload(ranked),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/uploads', async (_req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, file_name, file_size, mime_type, table_id, suggested_table_id,
              row_count, status, inserted, skipped, imported_at, created_at, headers,
              stored_path, extract_path
       FROM app_auth.import_uploads
       ORDER BY created_at DESC
       LIMIT 100`
    )
    for (const row of rows) {
      await purgeImportedUpload(row)
    }
    res.json({
      uploads: rows.map((row) => ({
        id: row.id,
        fileName: row.file_name,
        displayName: fileStem(row.file_name),
        fileSize: isImportedStatus(row.status) ? 0 : Number(row.file_size || 0),
        mimeType: row.mime_type,
        tableId: row.table_id,
        suggestedTableId: row.suggested_table_id,
        rowCount: row.row_count,
        status: row.status,
        inserted: row.inserted,
        skipped: row.skipped,
        importedAt: row.imported_at,
        createdAt: row.created_at,
        headerCount: Array.isArray(row.headers) ? row.headers.length : 0,
        source: isImportedStatus(row.status) ? 'database' : 'file',
        filesPurged: isImportedStatus(row.status) && !filesStillOnDisk(row),
      })),
    })
  } catch (err) {
    if (/does not exist/i.test(err.message)) return res.json({ uploads: [] })
    res.status(500).json({ error: err.message })
  }
})

router.get('/uploads/:id', async (req, res) => {
  try {
    const row = await getUpload(req.params.id)
    if (!row) return res.status(404).json({ error: 'Upload not found' })
    await purgeImportedUpload(row)
    if (!isImportedStatus(row.status)) await loadExtractedRows(row)
    const table = row.table_id ? resolveImportTable(row.table_id) : null
    const ranked = suggestBestTable(row.headers || [])
    const liveHeaders = table && isImportedStatus(row.status)
      ? (liveColumnNames(table).length ? liveColumnNames(table) : row.headers)
      : row.headers
    res.json({
      upload: serializeUpload(row, {
        table,
        suggestions: rankingPayload(ranked),
        fileDuplicates: row._fileDuplicates,
        duplicateReport: row._duplicateReport,
        headers: liveHeaders?.length ? liveHeaders : row.headers,
      }),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/uploads/:id/rows', async (req, res) => {
  try {
    const row = await getUpload(req.params.id)
    if (!row) return res.status(404).json({ error: 'Upload not found' })
    await purgeImportedUpload(row)
    const tableDef = row.table_id ? resolveImportTable(row.table_id) : null
    if (isImportedStatus(row.status) && tableDef && !filesStillOnDisk(row)) {
      const live = await loadLiveTablePage(tableDef, req.query)
      return res.json({ id: row.id, source: 'database', tableId: tableDef.id, ...live })
    }
    const offset = Math.max(0, Number(req.query.offset || 0))
    const limit = Math.min(200, Math.max(1, Number(req.query.limit || 50)))
    let extracted = readCachedExtract(row)
    if (!extracted.length) extracted = await loadExtractedRows(row)
    const headers = row.headers || (extracted[0] ? Object.keys(extracted[0]) : [])
    const filtered = filterExtractRows(extracted, headers, req.query)
    res.json({
      id: row.id,
      source: 'file',
      headers,
      total: filtered.length,
      fileTotal: extracted.length,
      offset,
      limit,
      rows: filtered.slice(offset, offset + limit),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/uploads/:id/row-filters', async (req, res) => {
  try {
    const row = await getUpload(req.params.id)
    if (!row) return res.status(404).json({ error: 'Upload not found' })
    await purgeImportedUpload(row)
    const tableDef = row.table_id ? resolveImportTable(row.table_id) : null
    if (isImportedStatus(row.status) && tableDef && !filesStillOnDisk(row)) {
      const filters = await loadLiveTableFilters(tableDef)
      return res.json({ id: row.id, source: 'database', ...filters })
    }
    let extracted = readCachedExtract(row)
    if (!extracted.length) extracted = await loadExtractedRows(row)
    const headers = row.headers || (extracted[0] ? Object.keys(extracted[0]) : [])
    const hospKey = findExtractHeader(headers, ['hosp_id', 'hospital_id', 'hospitalid'])
    const facKey = findExtractHeader(headers, ['facility_id', 'facilityid'])
    res.json({
      id: row.id,
      source: 'file',
      hospIdHeader: hospKey,
      facilityIdHeader: facKey,
      hospIds: distinctFieldValues(extracted, hospKey),
      facilityIds: distinctFieldValues(extracted, facKey),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'file is required' })
    ensureUploadRoot()

    const parsed = parseSpreadsheetBuffer(req.file.buffer, req.file.originalname)
    if (!parsed.headers.length || !parsed.rows.length) {
      return res.status(400).json({ error: 'No rows could be extracted from this file' })
    }

    const ranked = suggestBestTable(parsed.headers)
    const requestedTableId = req.body?.tableId || ''
    const table =
      getImportTable(requestedTableId) ||
      ranked[0]?.table ||
      null
    const mapping = table ? suggestMapping(parsed.headers, table) : {}

    const id = randomUUID()
    const dir = path.join(UPLOAD_ROOT, id)
    fs.mkdirSync(dir, { recursive: true })
    const storedPath = path.join(dir, req.file.originalname.replace(/[^\w.\-]+/g, '_'))
    const extractPath = path.join(dir, 'extracted.json')
    fs.writeFileSync(storedPath, req.file.buffer)
    fs.writeFileSync(extractPath, JSON.stringify(parsed.rows))
    fs.writeFileSync(
      path.join(dir, 'meta.json'),
      JSON.stringify({
        fileDuplicates: parsed.fileDuplicates || 0,
        duplicateReport: parsed.duplicateReport || null,
      })
    )

    const meta = {
      id,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      storedPath,
      extractPath,
      tableId: table?.id || null,
      suggestedTableId: ranked[0]?.table.id || null,
      headers: parsed.headers,
      mapping,
      rowCount: parsed.rows.length,
      preview: previewRows(parsed.rows),
    }
    await saveUploadRecord(meta)

    res.json({
      upload: serializeUpload(
        {
          id,
          file_name: meta.fileName,
          file_size: meta.fileSize,
          mime_type: meta.mimeType,
          table_id: meta.tableId,
          suggested_table_id: meta.suggestedTableId,
          headers: meta.headers,
          mapping: meta.mapping,
          row_count: meta.rowCount,
          preview: meta.preview,
          status: 'parsed',
          import_mode: null,
          inserted: null,
          skipped: null,
          import_errors: null,
          imported_at: null,
          created_at: new Date().toISOString(),
        },
        {
          table,
          suggestions: rankingPayload(ranked),
          sheetName: parsed.sheetName || null,
          fileDuplicates: parsed.fileDuplicates || 0,
          duplicateReport: parsed.duplicateReport || null,
        }
      ),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.patch('/uploads/:id', async (req, res) => {
  try {
    const row = await getUpload(req.params.id)
    if (!row) return res.status(404).json({ error: 'Upload not found' })
    if (isImportedStatus(row.status) && req.body?.tableId && req.body.tableId !== row.table_id) {
      return res.status(400).json({
        error: `This file is already imported into ${row.table_id}. Changing the table name does not move the data. Upload again to import into a different table.`,
      })
    }
    const tableId = req.body?.tableId
    const mapping = req.body?.mapping
    const table = tableId ? getImportTable(tableId) : row.table_id ? getImportTable(row.table_id) : null
    const nextMapping =
      mapping && typeof mapping === 'object'
        ? mapping
        : table
          ? suggestMapping(row.headers || [], table)
          : row.mapping

    await query(
      `UPDATE app_auth.import_uploads
       SET table_id = COALESCE($2, table_id), mapping = $3::jsonb
       WHERE id = $1`,
      [row.id, table?.id || tableId || null, JSON.stringify(nextMapping)]
    )
    const updated = await getUpload(row.id)
    res.json({ upload: serializeUpload(updated, { table }) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/uploads/:id/commit', async (req, res) => {
  try {
    const row = await getUpload(req.params.id)
    if (!row) return res.status(404).json({ error: 'Upload not found' })

    const tableId = req.body?.tableId || row.table_id
    const mapping = req.body?.mapping || row.mapping
    const tableDef = getImportTable(tableId)
    if (!tableDef) return res.status(404).json({ error: 'Table not in import whitelist' })

    const extracted = await loadExtractedRows(row)
    const mappedRows = applyMapping(extracted, mapping)
    const validation = validateMappedRows(tableDef, mappedRows)
    if (!validation.ok) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors })
    }

    const result = await insertMappedRows(tableDef, mappedRows)
    const status = result.errors.length === 0 ? 'imported' : 'imported_with_errors'
    await query(
      `UPDATE app_auth.import_uploads
       SET table_id = $2, mapping = $3::jsonb, import_mode = $4, inserted = $5,
           skipped = $6, import_errors = $7::jsonb, status = $8, imported_at = now()
       WHERE id = $1`,
      [
        row.id,
        tableDef.id,
        JSON.stringify(mapping),
        'append',
        result.inserted,
        result.skipped,
        JSON.stringify(result.errors),
        status,
      ]
    )

    row.status = status
    row.table_id = tableDef.id
    await purgeImportedUpload(row)

    res.json({
      ok: result.errors.length === 0,
      uploadId: row.id,
      tableId: tableDef.id,
      displayName: fileStem(row.file_name),
      source: 'database',
      mode: 'append',
      inserted: result.inserted,
      updated: result.updated || 0,
      skipped: result.skipped,
      skippedFile: result.skippedFile,
      skippedExisting: result.skippedExisting,
      uniqueKey: result.uniqueKey,
      total: result.total,
      columnsUsed: result.columnsUsed,
      errors: result.errors,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.delete('/uploads/:id', async (req, res) => {
  try {
    const row = await getUpload(req.params.id)
    if (!row) return res.status(404).json({ error: 'Upload not found' })
    fs.rmSync(uploadDir(row), { recursive: true, force: true })
    await query(`DELETE FROM app_auth.import_uploads WHERE id = $1`, [row.id])
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { tableId, rows } = req.body || {}
    const tableDef = getImportTable(tableId)
    if (!tableDef) return res.status(404).json({ error: 'Table not in import whitelist' })

    const validation = validateMappedRows(tableDef, rows)
    if (!validation.ok) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors })
    }

    const result = await insertMappedRows(tableDef, rows)
    res.json({
      ok: result.errors.length === 0,
      tableId: tableDef.id,
      mode: 'append',
      inserted: result.inserted,
      updated: result.updated || 0,
      skipped: result.skipped,
      skippedFile: result.skippedFile,
      skippedExisting: result.skippedExisting,
      uniqueKey: result.uniqueKey,
      total: result.total,
      columnsUsed: result.columnsUsed,
      errors: result.errors,
      db: (await query('SELECT 1'))._db,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
