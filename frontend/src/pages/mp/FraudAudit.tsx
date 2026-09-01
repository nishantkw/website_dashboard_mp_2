import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'
import { PageHeader } from '../../components/ui/PageHeader'
import FraudFilterBar from '../../components/layout/FraudFilterBar'
import SafuMisDashboard from './SafuMisDashboard'
import { SAFU_VIEW_TABS, type SafuView } from '../../data/safuConfig'
import { getFraudFiltersForView } from '../../data/fraudFilterConfig'
import { useFraudFilters } from '../../hooks/useFraudFilters'

const VALID_VIEWS = SAFU_VIEW_TABS.map((t) => t.id)

export default function FraudAudit() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as SafuView | null
  const view: SafuView = tabParam && VALID_VIEWS.includes(tabParam) ? tabParam : 'overall'

  const filterFields = useMemo(() => getFraudFiltersForView(view), [view])
  const fraudFilters = useFraudFilters(filterFields)

  const setView = (next: SafuView) => {
    setSearchParams({ tab: next }, { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Fraud and Audit"
        description="SAFU MIS / Fraud Monitoring — overall, doctor-wise, SHA-AFO-wise and trigger-wise analytics per FRS."
      />

      <FraudFilterBar
        fields={fraudFilters.resolvedFields}
        values={fraudFilters.filters}
        onChange={fraudFilters.setFilter}
        search={fraudFilters.search}
        onSearchChange={fraudFilters.setSearch}
        onClear={fraudFilters.clearFilters}
        activeCount={fraudFilters.activeCount}
        subtitle={` Filters for ${SAFU_VIEW_TABS.find((t) => t.id === view)?.label ?? view}`}
      />

      <div className="mb-5 flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {SAFU_VIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={clsx(
              'rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors',
              view === tab.id
                ? 'bg-[#2d8a4e] text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <SafuMisDashboard
        view={view}
        hideHeader
        filterRows={fraudFilters.filterRows}
        queryString={fraudFilters.queryString}
      />
    </div>
  )
}
