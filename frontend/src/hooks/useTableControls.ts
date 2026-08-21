import { useState, useEffect, useMemo } from 'react'

export const TABLE_PAGE_SIZE = 200

interface TableColumnLike {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

export function useTableControls(columns: TableColumnLike[], totalRows: number, pageSize = TABLE_PAGE_SIZE) {
  const columnSignature = columns.map((c) => c.key).join('|')

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => columns.map((c) => c.key))
  const [page, setPage] = useState(1)

  useEffect(() => {
    setVisibleKeys(columns.map((c) => c.key))
    setPage(1)
  }, [columnSignature])

  useEffect(() => {
    setPage(1)
  }, [totalRows])

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.includes(c.key)),
    [columns, visibleKeys]
  )

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const safePage = Math.min(page, totalPages)

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const startIndex = (safePage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalRows)

  const paginate = <T,>(rows: T[]): T[] => {
    if (totalRows <= pageSize) return rows
    return rows.slice(startIndex, endIndex)
  }

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev
        return prev.filter((k) => k !== key)
      }
      const next = new Set([...prev, key])
      return columns.map((c) => c.key).filter((k) => next.has(k))
    })
  }

  const showAllColumns = () => setVisibleKeys(columns.map((c) => c.key))

  return {
    visibleColumns,
    visibleKeys,
    toggleColumn,
    showAllColumns,
    page: safePage,
    setPage,
    totalPages,
    pageSize,
    startIndex,
    endIndex,
    paginate,
    showPagination: totalRows > pageSize,
  }
}
