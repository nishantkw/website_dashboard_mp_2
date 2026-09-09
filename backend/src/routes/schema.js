import { Router } from 'express'
import { getImportTables, getTablesByModule, getPrimaryTableForModule } from '../utils/schemaRegistry.js'
import { clientError } from '../utils/clientError.js'

const router = Router()

router.get('/tables', (_req, res) => {
  try {
    res.json({
      tables: getImportTables(),
      byModule: getTablesByModule(),
      total: getImportTables().length,
    })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

router.get('/modules', (_req, res) => {
  try {
    const modules = getTablesByModule().map((m) => ({
      ...m,
      primaryTable: getPrimaryTableForModule(m.module),
    }))
    res.json({ modules })
  } catch (err) {
    res.status(500).json({ error: clientError(err) })
  }
})

export default router
