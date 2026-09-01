import { useEffect, useState } from 'react'
import type { ApiResult } from '../api/client'
import { ENABLE_DEMO_FALLBACK } from '../data/demoFallback'

export type DataSource = 'api' | 'mock' | 'offline'

/**
 * Load remote API data.
 * Demo fallback is disabled by default — offline pages stay empty.
 */
export function useApiResource<T>(
  loader: () => Promise<ApiResult<T>>,
  /** Only used when ENABLE_DEMO_FALLBACK is true. */
  demoFallback: T,
  deps: unknown[] = []
) {
  const empty = (ENABLE_DEMO_FALLBACK ? demoFallback : ({} as T))
  const [data, setData] = useState<T>(empty)
  const [source, setSource] = useState<DataSource>(ENABLE_DEMO_FALLBACK ? 'mock' : 'offline')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [db, setDb] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    loader().then((result) => {
      if (cancelled) return
      if (result.ok) {
        setData(result.data)
        setSource('api')
        const maybeDb =
          (result.data as { db?: string }).db ??
          (result.data as { activeDb?: string }).activeDb ??
          null
        setDb(maybeDb)
      } else if (ENABLE_DEMO_FALLBACK) {
        setData(demoFallback)
        setSource('mock')
        setError(result.error)
        setDb(null)
      } else {
        setData({} as T)
        setSource('offline')
        setError(result.error)
        setDb(null)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, source, loading, error, db }
}
