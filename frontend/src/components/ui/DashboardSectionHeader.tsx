import StackedHeading from './StackedHeading'
import { tableDisplayDescription, tableDisplayTitle } from '../../utils/displayLabels'

interface DashboardSectionHeaderProps {
  /** Schema ref (e.g. dmart_mp.payment_dtls) or a human title */
  title: string
  /** Optional subtitle; auto-filled from displayLabels when omitted */
  subtitle?: string
  /** Used when title is not a known schema ref */
  fallbackTitle?: string
  className?: string
}

export default function DashboardSectionHeader({
  title,
  subtitle,
  fallbackTitle,
  className = 'mb-4 mt-5 rounded-xl border border-[#c5e0ce] bg-[#f4fbf6] px-4 py-3',
}: DashboardSectionHeaderProps) {
  const displayTitle = tableDisplayTitle(title, fallbackTitle ?? title)
  const displaySubtitle = subtitle ?? tableDisplayDescription(title)

  return (
    <div className={className}>
      <StackedHeading
        size="section"
        titleAs="p"
        title={displayTitle}
        subtitle={displaySubtitle}
        titleClassName="text-sm font-semibold text-[#1a5c38]"
        subtitleClassName="text-xs text-slate-500"
      />
    </div>
  )
}
