import { useState, useCallback } from 'react'
import DetailModal, { type DrillDownDetail } from '../components/ui/DetailModal'

export function useDrillDown() {
  const [detail, setDetail] = useState<DrillDownDetail | null>(null)

  const openDetail = useCallback((d: DrillDownDetail) => setDetail(d), [])
  const closeDetail = useCallback(() => setDetail(null), [])

  const openFromChart = useCallback(
    (payload: Record<string, string | number | undefined>, chartTitle: string) => {
      const { name, ...rest } = payload
      setDetail({
        title: String(name ?? chartTitle),
        subtitle: chartTitle,
        data: rest.value !== undefined ? { value: rest.value, ...rest } : rest,
      })
    },
    []
  )

  const openFromKpi = useCallback((label: string, value: string | number, extra?: Record<string, string | number>) => {
    setDetail({
      title: label,
      subtitle: 'KPI Details',
      data: { value, ...extra },
    })
  }, [])

  const Modal = () => <DetailModal detail={detail} onClose={closeDetail} />

  return { detail, openDetail, closeDetail, openFromChart, openFromKpi, Modal }
}
