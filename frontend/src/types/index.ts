export interface KPI {
  label: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: string
  color?: string
  link?: string
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
  type: 'select' | 'date' | 'search'
  options?: FilterOption[]
  column: string
}

export type FilterValues = Record<string, string>
