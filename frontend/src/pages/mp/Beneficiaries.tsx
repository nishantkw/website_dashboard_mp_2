import { useMemo } from 'react'
import ChartCard from '../../components/ui/ChartCard'
import DataTable from '../../components/ui/DataTable'
import { PageHeader, KPIGrid } from '../../components/ui/PageHeader'
import BeneficiariesFilterBar from '../../components/layout/BeneficiariesFilterBar'
import { InteractiveBarChart, InteractivePieChart, InteractiveLineChart } from '../../components/charts/InteractiveCharts'
import { useDrillDown } from '../../hooks/useDrillDown'
import { useApiResource } from '../../hooks/useApiResource'
import { useBeneficiariesFilters } from '../../hooks/useBeneficiariesFilters'
import { getBeneficiariesFiltersForPage } from '../../data/beneficiariesFilterConfig'
import { fetchBeneficiaries } from '../../api/endpoints'
import DataSourceBadge from '../../components/ui/DataSourceBadge'
import BackendOfflineNotice from '../../components/ui/BackendOfflineNotice'
import { schemaTableColumns } from '../../utils/schemaColumns'
import { districtEnrollmentChart } from '../../utils/chartDataPrep'
import { filterRowsForRuralUrbanLabel } from '../../utils/ruralUrban'
import { filterRowsForBeneficiaryKpi } from '../../utils/beneficiaryCodes'
import type { KPI, TableColumn } from '../../types'

const GENDER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6']
const STATUS_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8']

const RELATION_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#94a3b8']
const CARD_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#94a3b8']

const preferredColumns: TableColumn[] = [
  { key: 'ben_id', label: 'Ben ID' },
  { key: 'name', label: 'Name' },
  { key: 'family_id', label: 'Family ID' },
  { key: 'member_id', label: 'Member' },
  { key: 'gender', label: 'Gender' },
  { key: 'rural_urban_flag', label: 'Rural / Urban' },
  { key: 'dist_name', label: 'District' },
  { key: 'active_status', label: 'Active Status' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'card_status', label: 'Card Status' },
  { key: 'aadhar_status', label: 'Aadhaar Status' },
  { key: 'card_no', label: 'Card No' },
  { key: 'abha_id', label: 'ABHA ID' },
  { key: 'scheme_code', label: 'Scheme' },
  { key: 'relation', label: 'Relation' },
  { key: 'enrol_date', label: 'Enrol Date' },
]

const sourcePreferred: TableColumn[] = [
  { key: 'id_pk', label: 'ID' },
  { key: 'src_family_id', label: 'Source Family ID' },
  { key: 'name', label: 'Name' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'rural_urban_flag', label: 'Rural / Urban' },
  { key: 'relation', label: 'Relation' },
  { key: 'father_guardian_name', label: 'Father / Guardian' },
  { key: 'dist_cd', label: 'District Code' },
  { key: 'enrl_status', label: 'Enroll Status' },
  { key: 'card_status', label: 'Card Status' },
  { key: 'card_no', label: 'Card No' },
  { key: 'source_type', label: 'Source Type' },
]

const disabledPreferred: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'card_no', label: 'Card No' },
  { key: 'family_id', label: 'Family ID' },
  { key: 'member_id', label: 'Member ID' },
  { key: 'card_status', label: 'Card Status' },
  { key: 'source_type', label: 'Source Type' },
  { key: 'reason_desc', label: 'Disable Reason' },
  { key: 'disabled_date', label: 'Disabled Date' },
  { key: 'state_cd', label: 'State Code' },
  { key: 'acted_workflow_user', label: 'Acted By' },
]

const EMPTY = {
  kpis: [] as KPI[],
  charts: {} as Record<string, never>,
  table: [] as Record<string, string | number>[],
  sourceTable: [] as Record<string, string | number>[],
  disabledTable: [] as Record<string, string | number>[],
  bisTable: [] as Record<string, string | number>[],
  histTable: [] as Record<string, string | number>[],
  histSchema: '',
  columns: [] as string[],
  sourceColumns: [] as string[],
  disabledColumns: [] as string[],
  histColumns: [] as string[],
  disabledKpis: [] as KPI[],
  histKpis: [] as KPI[],
  bisKpis: [] as KPI[],
  bisColumns: [] as string[],
}

export default function Beneficiaries() {
  const filterFields = useMemo(() => getBeneficiariesFiltersForPage(), [])
  const benFilters = useBeneficiariesFilters(filterFields)

  const { data, source, db, loading, error } = useApiResource(
    () => fetchBeneficiaries(benFilters.queryString),
    EMPTY,
    [benFilters.queryString]
  )

  const live = source === 'api'
  const kpis = data.kpis ?? []
  const genderData = data.charts?.gender ?? []
  const urbanRural = data.charts?.urbanRural ?? []
  const enrollStatus = data.charts?.enrollStatus ?? []
  const cardStatus = data.charts?.cardStatus ?? []
  const aadhaarStatus = data.charts?.aadhaarStatus ?? []
  const scheme = data.charts?.scheme ?? []
  const benSourceType = data.charts?.benSourceType ?? []
  const benRelation = data.charts?.benRelation ?? []
  const authMode = data.charts?.authMode ?? []
  const enrollTrend = data.charts?.enrollTrend ?? []
  const districtRaw = data.charts?.district ?? []
  const sourceRelation = data.charts?.sourceRelation ?? []
  const sourceCardStatus = data.charts?.sourceCardStatus ?? []
  const sourceType = data.charts?.sourceType ?? []
  const sourceRuralUrban = data.charts?.sourceRuralUrban ?? []
  const sourceNfsa = data.charts?.sourceNfsa ?? []
  const disabledCardStatus = data.charts?.disabledCardStatus ?? []
  const disabledSourceType = data.charts?.disabledSourceType ?? []
  const disabledReason = data.charts?.disabledReason ?? []
  const disabledTrend = data.charts?.disabledTrend ?? []
  const disabledKpis = data.disabledKpis ?? []
  const bisGender = data.charts?.bisGender ?? []
  const bisEnroll = data.charts?.bisEnroll ?? []
  const bisSourceType = data.charts?.bisSourceType ?? []
  const bisCardStatus = data.charts?.bisCardStatus ?? []
  const bisKpis = data.bisKpis ?? []
  const districtChart = useMemo(
    () => districtEnrollmentChart(districtRaw as { name: string; enrolled: number; active: number }[]),
    [districtRaw]
  )
  const districtChartHeight = Math.min(520, Math.max(300, districtChart.length * 44 + 80))
  const tableRows = (data.table ?? []) as Record<string, string | number>[]
  const sourceRows = (data.sourceTable ?? []) as Record<string, string | number>[]
  const disabledRows = (data.disabledTable ?? []) as Record<string, string | number>[]
  const bisRows = (data.bisTable ?? []) as Record<string, string | number>[]
  const histRows = (data.histTable ?? []) as Record<string, string | number>[]
  const histKpis = data.histKpis ?? []
  const filtered = live ? tableRows : benFilters.filterRows(tableRows)
  const sourceFiltered = live ? sourceRows : benFilters.filterRows(sourceRows)
  const disabledFiltered = live ? disabledRows : benFilters.filterRows(disabledRows)
  const bisFiltered = live ? bisRows : benFilters.filterRows(bisRows)
  const histFiltered = live ? histRows : benFilters.filterRows(histRows)
  const columns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.columns,
        rows: tableRows,
        preferredFirst: preferredColumns.map((c) => c.key),
        demoColumns: preferredColumns,
      }),
    [source, data.columns, tableRows]
  )
  const sourceColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.sourceColumns,
        rows: sourceRows,
        preferredFirst: sourcePreferred.map((c) => c.key),
      }),
    [source, data.sourceColumns, sourceRows]
  )
  const disabledColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.disabledColumns,
        rows: disabledRows,
        preferredFirst: disabledPreferred.map((c) => c.key),
      }),
    [source, data.disabledColumns, disabledRows]
  )
  const bisColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.bisColumns,
        rows: bisRows,
        preferredFirst: preferredColumns.map((c) => c.key),
      }),
    [source, data.bisColumns, bisRows]
  )
  const histColumns = useMemo(
    () =>
      schemaTableColumns({
        source,
        schemaKeys: data.histColumns,
        rows: histRows,
        preferredFirst: preferredColumns.map((c) => c.key),
      }),
    [source, data.histColumns, histRows]
  )

  const { openFromChart, openFromKpi, openDetail, Modal } = useDrillDown({
    live,
    tableRows: filtered,
    columns,
    datasetTitle: 'Beneficiary Records',
    resolveContext: (chartTitle) => {
      if (/^bis /i.test(chartTitle)) {
        return { rows: bisFiltered, columns: bisColumns, datasetTitle: 'BIS Raw Beneficiaries' }
      }
      if (/disabled /i.test(chartTitle)) {
        return { rows: disabledFiltered, columns: disabledColumns, datasetTitle: 'Disabled Beneficiaries' }
      }
      if (/source /i.test(chartTitle)) {
        return { rows: sourceFiltered, columns: sourceColumns, datasetTitle: 'Source Family Data' }
      }
      if (/histor/i.test(chartTitle)) {
        return { rows: histFiltered, columns: histColumns, datasetTitle: 'Beneficiary History' }
      }
      return { rows: filtered, columns, datasetTitle: 'Beneficiary Records' }
    },
  })

  const handleKpi = (kpi: KPI) => {
    if (/source /i.test(kpi.label)) {
      openDetail({
        title: kpi.label,
        subtitle: `${sourceFiltered.length} record${sourceFiltered.length === 1 ? '' : 's'}`,
        records: sourceFiltered,
        columns: sourceColumns,
        datasetTitle: 'Source Family Data',
        source: live ? 'api' : 'demo',
      })
      return
    }
    if (/^disabled /i.test(kpi.label)) {
      openDetail({
        title: kpi.label,
        subtitle: `${disabledFiltered.length} record${disabledFiltered.length === 1 ? '' : 's'}`,
        records: disabledFiltered,
        columns: disabledColumns,
        datasetTitle: 'Disabled Beneficiaries',
        source: live ? 'api' : 'demo',
      })
      return
    }
    if (/^bis /i.test(kpi.label)) {
      openDetail({
        title: kpi.label,
        subtitle: `${bisFiltered.length} record${bisFiltered.length === 1 ? '' : 's'}`,
        records: bisFiltered,
        columns: bisColumns,
        datasetTitle: 'BIS Raw Beneficiaries',
        source: live ? 'api' : 'demo',
      })
      return
    }
    if (/^history /i.test(kpi.label)) {
      openDetail({
        title: kpi.label,
        subtitle: `${histFiltered.length} record${histFiltered.length === 1 ? '' : 's'}`,
        records: histFiltered,
        columns: histColumns,
        datasetTitle: 'Beneficiary History',
        source: live ? 'api' : 'demo',
      })
      return
    }
    const codedRows = filterRowsForBeneficiaryKpi(filtered, kpi.label)
    if (codedRows) {
      openDetail({
        title: kpi.label,
        subtitle: `${codedRows.length} record${codedRows.length === 1 ? '' : 's'}`,
        records: codedRows,
        columns,
        datasetTitle: 'Beneficiary Records',
        source: live ? 'api' : 'demo',
      })
      return
    }
    const ruralUrbanRows = filterRowsForRuralUrbanLabel(filtered, kpi.label)
    if (ruralUrbanRows) {
      openDetail({
        title: kpi.label,
        subtitle: `${ruralUrbanRows.length} record${ruralUrbanRows.length === 1 ? '' : 's'}`,
        records: ruralUrbanRows,
        columns,
        datasetTitle: 'Beneficiary Records',
        source: live ? 'api' : 'demo',
      })
      return
    }
    openFromKpi(kpi.label, kpi.value, { change: kpi.change ?? 0 })
  }

  const hasSourceCharts =
    sourceRelation.length > 0 ||
    sourceCardStatus.length > 0 ||
    sourceType.length > 0 ||
    sourceRuralUrban.length > 0 ||
    sourceNfsa.length > 0
  const hasDisabledCharts =
    disabledCardStatus.length > 0 ||
    disabledSourceType.length > 0 ||
    disabledReason.length > 0 ||
    disabledTrend.length > 0

  return (
    <div>
      <Modal />
      <PageHeader
        title="Beneficiaries"
        description={
          live
            ? `${data.schema ?? 'dmart_mp.t_bis_beneficiary_dtls'}${
                data.sourceSchema ? ` · ${data.sourceSchema}` : ''
              }${data.disabledSchema ? ` · ${data.disabledSchema}` : ''}${
                data.histSchema ? ` · ${data.histSchema}` : ''
              } — ${columns.length} schema fields`
            : 'Connect the backend to load beneficiary records'
        }
        badge={<DataSourceBadge source={source} db={db} />}
      />
      <BackendOfflineNotice error={error} loading={loading} />

      <BeneficiariesFilterBar
        fields={benFilters.resolvedFields}
        values={benFilters.filters}
        onChange={benFilters.setFilter}
        search={benFilters.search}
        onSearchChange={benFilters.setSearch}
        onClear={benFilters.clearFilters}
        activeCount={benFilters.activeCount}
      />

      {kpis.length > 0 && <KPIGrid kpis={kpis} onKpiClick={handleKpi} />}

      {(genderData.length > 0 || urbanRural.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {genderData.length > 0 && (
            <ChartCard title="Gender Distribution" exportData={genderData}>
              <InteractivePieChart data={genderData} colors={GENDER_COLORS} innerRadius={55} chartTitle="Gender" onItemClick={openFromChart} />
            </ChartCard>
          )}
          {urbanRural.length > 0 && (
            <ChartCard title="Urban vs Rural" exportData={urbanRural}>
              <InteractiveBarChart data={urbanRural} chartTitle="Urban/Rural" height={270} onItemClick={openFromChart} bars={[{ dataKey: 'value', fill: '#10b981', name: 'Count' }]} cellColors={['#f59e0b', '#10b981']} />
            </ChartCard>
          )}
        </div>
      )}

      {(districtChart.length > 0 || enrollStatus.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {districtChart.length > 0 && (
            <ChartCard
              title="District-wise Enrollment"
              subtitle="Enrolled vs Active beneficiaries — sorted by district (top 10 + Others)"
              exportData={districtChart}
            >
              <InteractiveBarChart
                data={districtChart}
                chartTitle="District Enrollment"
                layout="vertical"
                height={districtChartHeight}
                showLegend
                integerAxis
                onItemClick={openFromChart}
                bars={[
                  { dataKey: 'enrolled', fill: '#3b82f6', name: 'Enrolled' },
                  { dataKey: 'active', fill: '#10b981', name: 'Active' },
                ]}
              />
            </ChartCard>
          )}
          {enrollStatus.length > 0 && (
            <ChartCard title="Enrollment Status" subtitle="enrl_status (A = Approved, N = New)" exportData={enrollStatus}>
              <InteractivePieChart
                data={enrollStatus}
                colors={STATUS_COLORS}
                innerRadius={55}
                chartTitle="Enroll Status"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
        </div>
      )}

      {(cardStatus.length > 0 || aadhaarStatus.length > 0 || scheme.length > 0 || benSourceType.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {cardStatus.length > 0 && (
            <ChartCard title="Card Status" subtitle="card_status" exportData={cardStatus}>
              <InteractivePieChart
                data={cardStatus}
                colors={CARD_COLORS}
                innerRadius={55}
                chartTitle="Card Status"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {aadhaarStatus.length > 0 && (
            <ChartCard title="Aadhaar Status" subtitle="aadhar_status" exportData={aadhaarStatus}>
              <InteractivePieChart
                data={aadhaarStatus}
                colors={STATUS_COLORS}
                innerRadius={55}
                chartTitle="Aadhaar Status"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {scheme.length > 0 && (
            <ChartCard title="Scheme" subtitle="scheme_code" exportData={scheme}>
              <InteractiveBarChart
                data={scheme}
                chartTitle="Scheme"
                layout="vertical"
                height={Math.min(320, Math.max(200, scheme.length * 36 + 72))}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#6366f1', name: 'Count' }]}
              />
            </ChartCard>
          )}
          {benSourceType.length > 0 && (
            <ChartCard title="Beneficiary Source" subtitle="source_type" exportData={benSourceType}>
              <InteractiveBarChart
                data={benSourceType}
                chartTitle="Beneficiary Source"
                layout="vertical"
                height={Math.min(320, Math.max(200, benSourceType.length * 36 + 72))}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#2563eb', name: 'Count' }]}
              />
            </ChartCard>
          )}
        </div>
      )}

      {(benRelation.length > 0 || authMode.length > 0 || enrollTrend.length > 0) && (
        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {benRelation.length > 0 && (
            <ChartCard title="Relation" subtitle="relation" exportData={benRelation}>
              <InteractivePieChart
                data={benRelation}
                colors={RELATION_COLORS}
                innerRadius={55}
                chartTitle="Relation"
                onItemClick={openFromChart}
              />
            </ChartCard>
          )}
          {authMode.length > 0 && (
            <ChartCard title="Auth Mode" subtitle="auth_mode" exportData={authMode}>
              <InteractiveBarChart
                data={authMode}
                chartTitle="Auth Mode"
                layout="vertical"
                height={Math.min(320, Math.max(200, authMode.length * 36 + 72))}
                integerAxis
                onItemClick={openFromChart}
                bars={[{ dataKey: 'value', fill: '#0f766e', name: 'Count' }]}
              />
            </ChartCard>
          )}
          {enrollTrend.length > 0 && (
            <ChartCard title="Enrollment Trend" subtitle="enrol_date by month" exportData={enrollTrend}>
              <InteractiveLineChart
                data={enrollTrend}
                chartTitle="Enroll Trend"
                height={260}
                integerAxis
                onItemClick={openFromChart}
                lines={[{ dataKey: 'value', stroke: '#2563eb', name: 'Enrolled' }]}
              />
            </ChartCard>
          )}
        </div>
      )}

      <DataTable
        columns={columns}
        data={filtered}
        title={`Beneficiary Records (${filtered.length}${columns.length ? ` · ${columns.length} schema cols` : ''})`}
        onRowClick={(row) =>
          openDetail({
            title: String(row.ben_id || row.name || 'Beneficiary'),
            subtitle: 'Schema record',
            data: row,
          })
        }
      />

      {histFiltered.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Beneficiary history — dmart_mp.t_bis_beneficiary_dtl_hist</p>
            <p className="text-xs text-slate-500">
              Historical snapshots of beneficiary details (enrollment, active status, card and Aadhaar flags)
            </p>
          </div>
          {histKpis.length > 0 && <KPIGrid kpis={histKpis} onKpiClick={handleKpi} />}
          <DataTable
            columns={histColumns}
            data={histFiltered}
            title={`Beneficiary History — dmart_mp.t_bis_beneficiary_dtl_hist (${histFiltered.length}${
              histColumns.length ? ` · ${histColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.ben_id || row.name || 'History record'),
                subtitle: 'dmart_mp.t_bis_beneficiary_dtl_hist',
                data: row,
                columns: histColumns,
              })
            }
          />
        </>
      )}

      {sourceFiltered.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Source family data — dmart_mp.m_source_data</p>
            <p className="text-xs text-slate-500">
              Intake records with family ID, relation, enrollment and card fields from the beneficiary source table
            </p>
          </div>
          {hasSourceCharts && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {sourceRelation.length > 0 && (
                <ChartCard title="Source Relation" subtitle="relation" exportData={sourceRelation}>
                  <InteractivePieChart
                    data={sourceRelation}
                    colors={RELATION_COLORS}
                    innerRadius={55}
                    chartTitle="Source Relation"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {sourceCardStatus.length > 0 && (
                <ChartCard title="Source Card Status" subtitle="card_status" exportData={sourceCardStatus}>
                  <InteractivePieChart
                    data={sourceCardStatus}
                    colors={CARD_COLORS}
                    innerRadius={55}
                    chartTitle="Source Card Status"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {sourceType.length > 0 && (
                <ChartCard title="Source Type" subtitle="source_type / bis_source" exportData={sourceType}>
                  <InteractiveBarChart
                    data={sourceType}
                    chartTitle="Source Type"
                    layout="vertical"
                    height={Math.min(360, Math.max(220, sourceType.length * 36 + 72))}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#2563eb', name: 'Count' }]}
                  />
                </ChartCard>
              )}
              {sourceRuralUrban.length > 0 && (
                <ChartCard title="Source Rural / Urban" subtitle="rural_urban_flag" exportData={sourceRuralUrban}>
                  <InteractiveBarChart
                    data={sourceRuralUrban}
                    chartTitle="Source Rural/Urban"
                    height={270}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#10b981', name: 'Count' }]}
                    cellColors={['#f59e0b', '#10b981', '#94a3b8']}
                  />
                </ChartCard>
              )}
              {sourceNfsa.length > 0 && (
                <ChartCard title="Source NFSA Type" subtitle="nfsa_type" exportData={sourceNfsa}>
                  <InteractivePieChart
                    data={sourceNfsa}
                    colors={RELATION_COLORS}
                    innerRadius={55}
                    chartTitle="Source NFSA Type"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={sourceColumns}
            data={sourceFiltered}
            title={`Source Family Data — dmart_mp.m_source_data (${sourceFiltered.length}${
              sourceColumns.length ? ` · ${sourceColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.name || row.src_family_id || 'Source record'),
                subtitle: 'dmart_mp.m_source_data',
                data: row,
                columns: sourceColumns,
              })
            }
          />
        </>
      )}

      {disabledFiltered.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">Disabled beneficiaries — dmart_mp.t_bis_beneficiary_disabled</p>
            <p className="text-xs text-slate-500">
              Cards and members marked disabled, with reason, card status and disable date
            </p>
          </div>
          {disabledKpis.length > 0 && <KPIGrid kpis={disabledKpis} onKpiClick={handleKpi} />}
          {hasDisabledCharts && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {disabledReason.length > 0 && (
                <ChartCard title="Disabled Reason" subtitle="reason_desc" exportData={disabledReason}>
                  <InteractiveBarChart
                    data={disabledReason}
                    chartTitle="Disabled Reason"
                    layout="vertical"
                    height={Math.min(380, Math.max(220, disabledReason.length * 36 + 72))}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#ef4444', name: 'Records' }]}
                  />
                </ChartCard>
              )}
              {disabledCardStatus.length > 0 && (
                <ChartCard title="Disabled Card Status" subtitle="card_status" exportData={disabledCardStatus}>
                  <InteractivePieChart
                    data={disabledCardStatus}
                    colors={CARD_COLORS}
                    innerRadius={55}
                    chartTitle="Disabled Card Status"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {disabledSourceType.length > 0 && (
                <ChartCard title="Disabled Source Type" subtitle="source_type" exportData={disabledSourceType}>
                  <InteractivePieChart
                    data={disabledSourceType}
                    colors={RELATION_COLORS}
                    innerRadius={55}
                    chartTitle="Disabled Source Type"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {disabledTrend.length > 0 && (
                <ChartCard title="Disabled Trend" subtitle="disabled_date by month" exportData={disabledTrend}>
                  <InteractiveLineChart
                    data={disabledTrend}
                    chartTitle="Disabled Trend"
                    height={260}
                    integerAxis
                    onItemClick={openFromChart}
                    lines={[{ dataKey: 'value', stroke: '#dc2626', name: 'Disabled' }]}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={disabledColumns}
            data={disabledFiltered}
            title={`Disabled Beneficiaries — dmart_mp.t_bis_beneficiary_disabled (${disabledFiltered.length}${
              disabledColumns.length ? ` · ${disabledColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.name || row.card_no || row.member_id || 'Disabled record'),
                subtitle: 'dmart_mp.t_bis_beneficiary_disabled',
                data: row,
                columns: disabledColumns,
              })
            }
          />
        </>
      )}

      {bisFiltered.length > 0 && (
        <>
          <div className="mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3">
            <p className="text-sm font-semibold text-[#1a5c38]">BIS raw beneficiaries — bis_raw.t_bis_beneficiary_dtls</p>
            <p className="text-xs text-slate-500">
              Raw BIS beneficiary master (ben ID, family, district, enrollment) distinct from the dmart beneficiary table
            </p>
          </div>
          {bisKpis.length > 0 && <KPIGrid kpis={bisKpis} onKpiClick={handleKpi} />}
          {(bisGender.length > 0 || bisEnroll.length > 0 || bisSourceType.length > 0 || bisCardStatus.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              {bisGender.length > 0 && (
                <ChartCard title="BIS Gender" exportData={bisGender}>
                  <InteractivePieChart
                    data={bisGender}
                    colors={GENDER_COLORS}
                    innerRadius={55}
                    chartTitle="BIS Gender"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {bisEnroll.length > 0 && (
                <ChartCard title="BIS Enrollment" subtitle="enrl_status" exportData={bisEnroll}>
                  <InteractivePieChart
                    data={bisEnroll}
                    colors={STATUS_COLORS}
                    innerRadius={55}
                    chartTitle="BIS Enrollment"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
              {bisSourceType.length > 0 && (
                <ChartCard title="BIS Source Type" subtitle="source_type" exportData={bisSourceType}>
                  <InteractiveBarChart
                    data={bisSourceType}
                    chartTitle="BIS Source Type"
                    layout="vertical"
                    height={Math.min(360, Math.max(220, bisSourceType.length * 36 + 72))}
                    integerAxis
                    onItemClick={openFromChart}
                    bars={[{ dataKey: 'value', fill: '#2563eb', name: 'Count' }]}
                  />
                </ChartCard>
              )}
              {bisCardStatus.length > 0 && (
                <ChartCard title="BIS Card Status" subtitle="card_status" exportData={bisCardStatus}>
                  <InteractivePieChart
                    data={bisCardStatus}
                    colors={CARD_COLORS}
                    innerRadius={55}
                    chartTitle="BIS Card Status"
                    onItemClick={openFromChart}
                  />
                </ChartCard>
              )}
            </div>
          )}
          <DataTable
            columns={bisColumns}
            data={bisFiltered}
            title={`BIS Raw Beneficiaries — bis_raw.t_bis_beneficiary_dtls (${bisFiltered.length}${
              bisColumns.length ? ` · ${bisColumns.length} schema cols` : ''
            })`}
            onRowClick={(row) =>
              openDetail({
                title: String(row.ben_id || row.name || row.id_pk || 'BIS record'),
                subtitle: 'bis_raw.t_bis_beneficiary_dtls',
                data: row,
                columns: bisColumns,
              })
            }
          />
        </>
      )}
    </div>
  )
}
