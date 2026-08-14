import { Filter, RotateCcw, Search } from 'lucide-react'
import {
  SCHEMA_OPTIONS, STATE_OPTIONS, DISTRICT_OPTIONS, STATUS_OPTIONS,
  GENDER_OPTIONS, URBAN_RURAL_OPTIONS, HOSPITAL_TYPE_OPTIONS,
  CASE_TYPE_OPTIONS, ROLE_OPTIONS, DEPARTMENT_OPTIONS, EKYC_OPTIONS,
  FRAUD_TYPE_OPTIONS, COURSE_OPTIONS, NABH_OPTIONS,
} from '../../data/filterOptions'
import { useGlobalFilters } from '../../context/FilterContext'

interface FilterSelectProps {
  label: string
  column: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

function FilterSelect({ label, column, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="shrink-0">
      <label className="block text-[9px] font-semibold text-[#4a7c59] uppercase tracking-wide mb-0.5">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        title={column}
        className="text-xs border border-[#a8d5b5] rounded-md px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-[#2d8a4e] cursor-pointer min-w-[120px] max-w-[150px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function GlobalFilterBar() {
  const { globalFilters, setGlobalFilter, clearGlobalFilters, activeGlobalCount, search, setSearch } = useGlobalFilters()

  return (
    <div className="w-full border-t border-[#a8d5b5]/60 pt-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#2d8a4e]" />
          <span className="text-xs font-semibold text-[#1a5c38]">Filters</span>
          {activeGlobalCount > 0 && (
            <span className="text-[10px] font-bold bg-[#2d8a4e] text-white px-2 py-0.5 rounded-full">
              {activeGlobalCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white border border-[#a8d5b5] rounded-md px-2 py-1">
            <Search className="w-3.5 h-3.5 text-[#6b9e7a]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search records..."
              className="text-xs outline-none w-28 sm:w-36 bg-transparent text-gray-700 placeholder-[#6b9e7a]"
            />
          </div>
          <button
            onClick={clearGlobalFilters}
            title="Reset all filter dropdowns and search to default"
            className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-all border whitespace-nowrap ${
              activeGlobalCount > 0
                ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 shadow-sm'
                : 'bg-white/80 text-slate-600 border-[#a8d5b5] hover:bg-white hover:text-[#1a5c38]'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#2d8a4e]" />
            Clear Filters
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterSelect label="Schema" column="schema_name" value={globalFilters.schema} options={SCHEMA_OPTIONS} onChange={(v) => setGlobalFilter('schema', v)} />
        <FilterSelect label="State" column="state_name" value={globalFilters.state} options={STATE_OPTIONS} onChange={(v) => setGlobalFilter('state', v)} />
        <FilterSelect label="District" column="district_name" value={globalFilters.district} options={DISTRICT_OPTIONS} onChange={(v) => setGlobalFilter('district', v)} />
        <FilterSelect label="Status" column="case_status" value={globalFilters.status} options={STATUS_OPTIONS} onChange={(v) => setGlobalFilter('status', v)} />
        <FilterSelect label="Gender" column="gender" value={globalFilters.gender} options={GENDER_OPTIONS} onChange={(v) => setGlobalFilter('gender', v)} />
        <FilterSelect label="Urban/Rural" column="urban_or_rural" value={globalFilters.urban_rural} options={URBAN_RURAL_OPTIONS} onChange={(v) => setGlobalFilter('urban_rural', v)} />
        <FilterSelect label="Hospital Type" column="hospital_type" value={globalFilters.hospital_type} options={HOSPITAL_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('hospital_type', v)} />
        <FilterSelect label="Case Type" column="case_type" value={globalFilters.case_type} options={CASE_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('case_type', v)} />
        <FilterSelect label="Role" column="role" value={globalFilters.role} options={ROLE_OPTIONS} onChange={(v) => setGlobalFilter('role', v)} />
        <FilterSelect label="Department" column="department" value={globalFilters.department} options={DEPARTMENT_OPTIONS} onChange={(v) => setGlobalFilter('department', v)} />
        <FilterSelect label="eKYC" column="ekyc_status" value={globalFilters.ekyc} options={EKYC_OPTIONS} onChange={(v) => setGlobalFilter('ekyc', v)} />
        <FilterSelect label="Fraud Type" column="fraud_type" value={globalFilters.fraud_type} options={FRAUD_TYPE_OPTIONS} onChange={(v) => setGlobalFilter('fraud_type', v)} />
        <FilterSelect label="Course" column="course_name" value={globalFilters.course} options={COURSE_OPTIONS} onChange={(v) => setGlobalFilter('course', v)} />
        <FilterSelect label="NABH" column="nabh_certified" value={globalFilters.nabh} options={NABH_OPTIONS} onChange={(v) => setGlobalFilter('nabh', v)} />

        <div className="shrink-0">
          <label className="block text-[9px] font-semibold text-[#4a7c59] uppercase tracking-wide mb-0.5">From Date</label>
          <input
            type="date"
            value={globalFilters.date_from}
            onChange={(e) => setGlobalFilter('date_from', e.target.value)}
            title="date_from"
            className="text-xs border border-[#a8d5b5] rounded-md px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-[#2d8a4e] w-[130px]"
          />
        </div>
        <div className="shrink-0">
          <label className="block text-[9px] font-semibold text-[#4a7c59] uppercase tracking-wide mb-0.5">To Date</label>
          <input
            type="date"
            value={globalFilters.date_to}
            onChange={(e) => setGlobalFilter('date_to', e.target.value)}
            title="date_to"
            className="text-xs border border-[#a8d5b5] rounded-md px-2 py-1.5 bg-white text-gray-700 outline-none focus:border-[#2d8a4e] w-[130px]"
          />
        </div>
      </div>
    </div>
  )
}
