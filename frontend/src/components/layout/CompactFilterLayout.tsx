import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Filter } from 'lucide-react'
import {
  compactFilterBarClass,
  compactFilterCountClass,
  compactFilterFieldsClass,
  compactFilterShellClass,
  compactFilterSplitClass,
  compactFilterTitleClass,
  compactSearchCardClass,
} from './compactFilterStyles'

interface CompactFilterLayoutProps {
  title: string
  activeCount: number
  renderSearch: () => ReactNode
  renderClear: () => ReactNode
  children: ReactNode
  /** Sticky page wrapper. Omit for the global header bar. */
  sticky?: boolean
}

export default function CompactFilterLayout({
  title,
  activeCount,
  renderSearch,
  renderClear,
  children,
  sticky = true,
}: CompactFilterLayoutProps) {
  const [open, setOpen] = useState(false)
  const fieldsId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [open])

  return (
    <div ref={rootRef} className={sticky ? compactFilterBarClass : undefined}>
      <div className={`${compactFilterSplitClass} max-lg:gap-0`}>
        <div className={`${compactFilterShellClass} relative overflow-visible lg:overflow-hidden`}>
          <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-2">
            <div className="flex min-w-0 shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className={`${compactFilterTitleClass} lg:hidden`}
                aria-expanded={open}
                aria-controls={fieldsId}
              >
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">Filters</span>
                {activeCount > 0 && <span className={compactFilterCountClass}>{activeCount}</span>}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              <div className={`${compactFilterTitleClass} hidden lg:flex`}>
                <Filter className="h-3.5 w-3.5" />
                <span className="text-[11px] font-bold">{title}</span>
                {activeCount > 0 && <span className={compactFilterCountClass}>{activeCount}</span>}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-1.5 lg:hidden">
                {renderSearch()}
                {renderClear()}
              </div>
            </div>

            <div
              id={fieldsId}
              className={
                open
                  ? 'scrollbar-visible absolute left-0 right-0 top-full z-[60] mt-1.5 grid max-h-[min(50vh,20rem)] grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-[#7dbe94] bg-[#f7fcf9] p-2 shadow-lg lg:static lg:z-auto lg:mt-0 lg:flex lg:max-h-none lg:min-w-0 lg:flex-1 lg:flex-nowrap lg:items-center lg:gap-2 lg:overflow-x-auto lg:overflow-y-visible lg:overscroll-x-contain lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0 lg:pb-1 lg:shadow-none'
                  : `hidden lg:flex ${compactFilterFieldsClass}`
              }
            >
              {children}
            </div>
          </div>
        </div>

        <div className={`${compactSearchCardClass} hidden lg:flex`}>
          {renderSearch()}
          {renderClear()}
        </div>
      </div>
    </div>
  )
}
