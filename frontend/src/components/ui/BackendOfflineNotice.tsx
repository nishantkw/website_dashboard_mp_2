import { AlertTriangle } from 'lucide-react'

/** Shown when the API is unreachable and demo fallback is disabled. */
export default function BackendOfflineNotice({
  error,
  loading,
}: {
  error?: string | null
  loading?: boolean
}) {
  if (loading || !error) return null

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      <div>
        <p className="font-semibold">Backend unavailable</p>
        <p className="mt-0.5 text-xs text-amber-800/90">
          No demo data is shown. Start the API and refresh to load live records.
          {error ? ` (${error})` : ''}
        </p>
      </div>
    </div>
  )
}
