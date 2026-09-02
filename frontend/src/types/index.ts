export interface KPI {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: string
  color?: string
  link?: string
  subValue?: string
  /** Claim lifecycle bucket key, e.g. `claims_paid`. */
  key?: string
}

export interface ChartDataPoint {
  name: string
  value?: number
  [key: string]: string | number | undefined
}

export interface TableColumn {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

export interface NavItem {
  id: string
  label: string
  path?: string
  icon?: string
  /** When true, NavLink only matches this exact path (not sub-routes). */
  end?: boolean
  children?: NavItem[]
}

export interface DepartmentMeta {
  title: string
  description: string
  schema: string
}

export interface FilterOption {
  value: string
  label: string
}

export interface FilterField {
  key: string
  label: string
  type: 'select' | 'date' | 'search' | 'text' | 'searchable'
  options?: FilterOption[]
  column: string
}

export type FilterValues = Record<string, string>
