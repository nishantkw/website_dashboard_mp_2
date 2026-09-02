import type { KPI } from '../types'

export type SafuView = 'overall' | 'doctor-wise' | 'sha-afo-wise' | 'trigger-analytics'

export interface SafuViewConfig {
  title: string
  description: string
  frSection: string
}

export const SAFU_VIEW_TABS: { id: SafuView; label: string }[] = [
  { id: 'overall', label: 'Overall SAFU Dashboard' },
  { id: 'doctor-wise', label: 'SAFU Doctor-wise' },
  { id: 'sha-afo-wise', label: 'SHA-AFO-wise' },
  { id: 'trigger-analytics', label: 'Trigger-wise Analytics' },
]

export const SAFU_VIEW_CONFIG: Record<SafuView, SafuViewConfig> = {
  overall: {
    title: 'Overall SAFU Dashboard',
    description:
      'State-level monitoring of suspicious, fraud-detected, under-process cases, query pendency and public vs private hospital analysis.',
    frSection: ' ',
  },
  'doctor-wise': {
    title: 'SAFU Doctor-wise Dashboard',
    description:
      'Suspicious, abuse-detected, fraud detected, under-process, query to hospital and query to CPD — by count and claim amount per SAFU Doctor.',
    frSection: 'FR-01 to FR-06',
  },
  'sha-afo-wise': {
    title: 'SHA-AFO-wise Dashboard',
    description:
      'SAFU case workload, disposal and pendency by SHA-AFO officer — suspicious, abuse, fraud, under-process and query cases.',
    frSection: ' ',
  },
  'trigger-analytics': {
    title: 'Trigger-wise Analytics',
    description:
      'Trigger effectiveness and outcomes — total triggers, abuse, fraud, non-fraud, under-process, and fraud/non-fraud rates in public and private hospitals.',
    frSection: 'FR-08 to FR-14',
  },
}

export const safuOverallKPIs: KPI[] = [
  { label: 'Suspicious Cases', value: '342', change: -12.5, changeLabel: 'vs last month', color: 'orange' },
  { label: 'Abuse Detected', value: '48', change: 3.1, color: 'red' },
  { label: 'Fraud Detected', value: '52', change: -8.1, color: 'red' },
  { label: 'Non-Fraud', value: '162', change: 18.4, color: 'green' },
  { label: 'Under Process', value: '128', change: 5.2, color: 'blue' },
  { label: 'Query I Pending', value: '34', change: -4.0, color: 'orange' },
  { label: 'Query II Pending', value: '21', change: 2.3, color: 'orange' },
  { label: 'Query III Pending', value: '15', change: -1.8, color: 'orange' },
]

export const safuDoctorWiseKPIs: KPI[] = [
  { label: 'Active SAFU Doctors', value: '24', color: 'blue' },
  { label: 'Suspicious (Doctor-wise)', value: '342', change: -12.5, color: 'orange' },
  { label: 'Abuse Detected', value: '48', color: 'red' },
  { label: 'Fraud Detected', value: '52', color: 'red' },
  { label: 'Under Process', value: '128', color: 'blue' },
  { label: 'Query to Hospital', value: '34', color: 'orange' },
  { label: 'Query to CPD', value: '21', color: 'orange' },
]

export const safuShaAfoKPIs: KPI[] = [
  { label: 'Active SHA-AFO Officers', value: '18', color: 'blue' },
  { label: 'Suspicious (SHA-AFO-wise)', value: '342', change: -12.5, color: 'orange' },
  { label: 'Abuse Detected', value: '48', color: 'red' },
  { label: 'Fraud Detected', value: '52', color: 'red' },
  { label: 'Under Process', value: '128', color: 'blue' },
  { label: 'Query I Pending', value: '34', color: 'orange' },
  { label: 'Query II Pending', value: '21', color: 'orange' },
]

export const safuTriggerKPIs: KPI[] = [
  { label: 'Total Triggers', value: '330', change: 6.2, color: 'blue' },
  { label: 'Abuse Detected', value: '48', color: 'red' },
  { label: 'Fraud Outcome', value: '52', color: 'red' },
  { label: 'Non-Fraud Outcome', value: '162', color: 'green' },
  { label: 'Under Process', value: '128', color: 'orange' },
  { label: 'Fraud Rate (Public)', value: '18.4%', color: 'red' },
  { label: 'Fraud Rate (Private)', value: '22.1%', color: 'red' },
  { label: 'Non-Fraud Rate (Public)', value: '61.2%', color: 'green' },
]

export const SAFU_VIEW_KPIS: Record<SafuView, KPI[]> = {
  overall: safuOverallKPIs,
  'doctor-wise': safuDoctorWiseKPIs,
  'sha-afo-wise': safuShaAfoKPIs,
  'trigger-analytics': safuTriggerKPIs,
}
