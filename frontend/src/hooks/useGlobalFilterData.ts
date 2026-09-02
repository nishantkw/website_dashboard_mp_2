import { useCallback } from 'react'
import { useGlobalFilters } from '../context/FilterContext'
import { rowKeyMap } from '../data/pageFilters'

function hasOwn(row: Record<string, string | number>, key: string) {
  return Object.prototype.hasOwnProperty.call(row, key)
}

function matchesValue(row: Record<string, string | number>, keys: string[], val: string) {
  const haystack = keys
    .filter((key) => hasOwn(row, key))
    .map((key) => String(row[key] ?? '').toLowerCase())
    .join(' ')
  if (!haystack) return true
  return haystack.includes(val.toLowerCase())
}

export function useGlobalFilterData() {
  const { globalFilters, search } = useGlobalFilters()

  const filterData = useCallback(
    <T extends Record<string, string | number>>(data: T[]): T[] => {
      return data.filter((row) => {
        if (search) {
          const haystack = Object.values(row).join(' ').toLowerCase()
          if (!haystack.includes(search.toLowerCase())) return false
        }

        const checks: [string, string][] = [
          ['state', 'state'],
          ['district', 'district'],
          ['gender', 'gender'],
          ['ekyc', 'ekyc'],
          ['role', 'role'],
          ['department', 'department'],
          ['course', 'course'],
          ['hospital_type', 'type'],
          ['nabh', 'nabh'],
          ['fraud_type', 'fraud_type'],
        ]

        for (const [filterKey, defaultRowKey] of checks) {
          const val = globalFilters[filterKey]
          if (!val) continue
          const rowKey = rowKeyMap[filterKey] ?? defaultRowKey
          const rowKeys = rowKey === 'district' ? ['district', 'district_name', 'hosp_district_name', 'patient_district_name'] : [rowKey]
          if (!rowKeys.some((k) => hasOwn(row, k))) continue
          if (!rowKeys.some((k) => String(row[k] ?? '').toLowerCase().includes(val.toLowerCase()))) return false
        }

        if (globalFilters.claim_status) {
          const isClaim = hasOwn(row, 'procedure') || hasOwn(row, 'case_type') || hasOwn(row, 'claim_date')
          if (isClaim && !matchesValue(row, ['status'], globalFilters.claim_status)) return false
        }

        if (globalFilters.card_status) {
          const isCard = hasOwn(row, 'card_no') || hasOwn(row, 'card_status') || hasOwn(row, 'print_status')
          if (isCard && !matchesValue(row, ['card_status', 'status', 'print_status'], globalFilters.card_status)) return false
        }

        if (globalFilters.user_status) {
          const isUser = hasOwn(row, 'user_id') || hasOwn(row, 'userid')
          if (isUser && !matchesValue(row, ['status'], globalFilters.user_status)) return false
        }

        if (globalFilters.hospital_status) {
          const isHospital = hasOwn(row, 'facility_id') || (hasOwn(row, 'nabh') && hasOwn(row, 'code'))
          if (isHospital && !matchesValue(row, ['enrl_status', 'active_status', 'status'], globalFilters.hospital_status)) return false
        }

        if (globalFilters.patient_status) {
          const isPatient = hasOwn(row, 'patient_id')
          if (isPatient && !matchesValue(row, ['status'], globalFilters.patient_status)) return false
        }

        if (globalFilters.investigation_status) {
          const isFraud = hasOwn(row, 'amount_risk') || hasOwn(row, 'investigator') || hasOwn(row, 'investigation_status')
          if (isFraud && !matchesValue(row, ['investigation_status', 'status'], globalFilters.investigation_status)) return false
        }

        if (globalFilters.training_status) {
          const isTraining = hasOwn(row, 'ab_pmjay_status') || hasOwn(row, 'abdm_status')
          if (isTraining && !matchesValue(row, ['ab_pmjay_status', 'abdm_status'], globalFilters.training_status)) return false
        }

        if (globalFilters.enrollment_status) {
          const isBeneficiary = hasOwn(row, 'ben_id') && hasOwn(row, 'enrl_status')
          if (isBeneficiary && !matchesValue(row, ['enrl_status'], globalFilters.enrollment_status)) return false
        }

        if (globalFilters.date_from || globalFilters.date_to) {
          const dateKey = Object.keys(row).find((k) =>
            ['enroll_date', 'admission', 'created', 'last_login', 'completed_on', 'lst_trigger_event_date', 'trigger_time', 'crt_date', 'updt_date'].includes(k)
          )
          if (dateKey) {
            const rowDate = String(row[dateKey]).slice(0, 10)
            if (globalFilters.date_from && rowDate < globalFilters.date_from) return false
            if (globalFilters.date_to && rowDate > globalFilters.date_to) return false
          }
        }

        return true
      })
    },
    [globalFilters, search]
  )

  return { filterData, globalFilters, search }
}
