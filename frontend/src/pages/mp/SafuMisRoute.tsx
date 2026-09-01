import { Navigate, useParams } from 'react-router-dom'
import type { SafuView } from '../../data/safuConfig'

const VALID_VIEWS: SafuView[] = ['overall', 'doctor-wise', 'sha-afo-wise', 'trigger-analytics']

/** Legacy /dashboard/mp/safu/:view → unified Fraud and Audit page */
export default function SafuMisRoute() {
  const { view } = useParams<{ view: string }>()
  const tab = view && VALID_VIEWS.includes(view as SafuView) ? view : 'overall'
  return <Navigate to={`/dashboard/mp/fraud-audit?tab=${tab}`} replace />
}
