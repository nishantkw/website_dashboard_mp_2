/** Empanelment lifecycle vs whether the hospital is currently serving — keep these visually distinct. */

const NOT_EMPANELLED =
  /de[- ]?empane|reject|draft|invalid|suspend|cancel|pending|not[- ]?empanel|disempanel/i

export function isHospitalEmpanelled(row: Record<string, unknown> | null | undefined): boolean {
  if (!row) return false
  const desc = String(row.hosp_status_desc ?? '').trim()
  if (desc) {
    if (NOT_EMPANELLED.test(desc)) return false
    return /^empane/i.test(desc)
  }
  const enroll = String(row.enrl_status ?? '').trim()
  if (!enroll) return false
  if (NOT_EMPANELLED.test(enroll)) return false
  if (/^empane/i.test(enroll)) return true
  return enroll === '1'
}

export function isHospitalFlaggedActive(row: Record<string, unknown> | null | undefined): boolean {
  return /^(1|active|yes|true)$/i.test(String(row?.active_status ?? '').trim())
}

/** Only empanelled hospitals can be active for the claims scheme. */
export function isHospitalServingClaims(row: Record<string, unknown> | null | undefined): boolean {
  return isHospitalFlaggedActive(row) && isHospitalEmpanelled(row)
}

export function hospitalStatusHeader(key: string, fallbackLabel: string) {
  if (key === 'hosp_status_desc') {
    return { title: 'Empanelment status', hint: 'Empanelled, de-empanelled, draft, invalid' }
  }
  if (key === 'active_status') {
    return { title: 'Currently serving', hint: 'Only empanelled hospitals can serve claims' }
  }
  return { title: fallbackLabel, hint: '' }
}

export function HospitalColumnHeader({ columnKey, label }: { columnKey: string; label: string }) {
  const { title, hint } = hospitalStatusHeader(columnKey, label)
  if (!hint) return <>{label}</>
  return (
    <span className="flex flex-col items-start gap-0.5 normal-case tracking-normal">
      <span className="uppercase tracking-wider">{title}</span>
      <span className="max-w-[12rem] whitespace-normal text-[10px] font-medium leading-tight text-slate-400">
        {hint}
      </span>
    </span>
  )
}

function badgeClass(tone: 'green' | 'red' | 'amber' | 'slate' | 'blue') {
  if (tone === 'green') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (tone === 'red') return 'border-red-200 bg-red-50 text-red-800'
  if (tone === 'amber') return 'border-amber-200 bg-amber-50 text-amber-900'
  if (tone === 'blue') return 'border-sky-200 bg-sky-50 text-sky-800'
  return 'border-slate-200 bg-slate-100 text-slate-700'
}

export function HospitalStatusCell({
  columnKey,
  value,
  row,
}: {
  columnKey: string
  value: unknown
  row?: Record<string, unknown>
}) {
  const raw = String(value ?? '').trim()
  if (columnKey === 'hosp_status_desc') {
    const lower = raw.toLowerCase()
    let tone: 'green' | 'red' | 'amber' | 'slate' | 'blue' = 'slate'
    if (/de-?empanel|reject/.test(lower)) tone = 'red'
    else if (/empanel/.test(lower)) tone = 'green'
    else if (/draft|pending/.test(lower)) tone = 'amber'
    else if (/invalid|suspend/.test(lower)) tone = 'slate'
    return (
      <span className={`inline-flex max-w-[14rem] whitespace-normal rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight ${badgeClass(tone)}`}>
        {raw || '—'}
      </span>
    )
  }
  if (columnKey === 'active_status') {
    const serving = isHospitalServingClaims(row ?? { active_status: raw, hosp_status_desc: '' })
    if (serving) {
      return (
        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass('blue')}`}>
          Active — serving
        </span>
      )
    }
    const empanelled = isHospitalEmpanelled(row ?? { hosp_status_desc: '', enrl_status: '' })
    return (
      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass('slate')}`}>
        {empanelled ? 'Inactive — not serving' : 'Not serving — not empanelled'}
      </span>
    )
  }
  return null
}

export function isHospitalStatusColumn(key: string) {
  return key === 'hosp_status_desc' || key === 'active_status'
}
