import type { DataSource } from '../../hooks/useApiResource'

/** Badge showing whether page data came from the API or is offline. */
export default function DataSourceBadge({
  source,
  db,
}: {
  source: DataSource
  db?: string | null
}) {
  if (source === 'api') {
    return (
      <span
        className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200"
        title="Loaded from backend database"
      >
        Live DB{db ? ` · ${db}` : ''}
      </span>
    )
  }

  if (source === 'offline') {
    return (
      <span
        className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
        title="Backend unreachable — no data loaded"
      >
        Offline
      </span>
    )
  }

  return (
    <span
      className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200"
      title="Temporary demo fallback"
    >
      Demo data (API offline)
    </span>
  )
}
