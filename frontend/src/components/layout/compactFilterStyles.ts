export const compactFilterShellClass =
  'relative min-w-0 flex-1 overflow-visible rounded-lg border border-[#7dbe94] bg-gradient-to-r from-[#d4eedd] via-[#f7fcf9] to-[#e7f6ee] py-1.5 pl-4 pr-3 shadow-[0_2px_12px_-3px_rgba(26,92,56,0.2)] before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-gradient-to-b before:from-[#1a5c38] before:via-[#2d8a4e] before:to-[#3aa86a]'

export const compactFilterSplitClass = 'flex min-w-0 flex-col gap-2 lg:flex-row lg:items-stretch'

export const compactSearchCardClass =
  'flex w-full shrink-0 items-center gap-2 rounded-lg border border-[#7dbe94] bg-gradient-to-r from-[#e8f6ee] to-[#d4eedd] px-2.5 py-1.5 shadow-[0_2px_12px_-3px_rgba(26,92,56,0.2)] lg:w-auto'

export const compactFilterBarClass =
  'sticky top-0 z-50 min-w-0 -mx-4 mb-3 bg-[#f0f7f2] px-4 pb-2 lg:-mx-6 lg:mb-4 lg:px-6 lg:pb-3'

export const compactFilterTitleClass =
  'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md bg-gradient-to-r from-[#1a5c38] to-[#2d8a4e] px-2 py-1 text-white shadow-sm'

export const compactFilterRowClass = 'flex min-w-0 flex-nowrap items-center gap-2'

export const compactFilterFieldsClass =
  'scrollbar-visible flex min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto overscroll-x-contain pb-1'

export const compactFilterFieldClass =
  'flex shrink-0 items-center gap-1.5 whitespace-nowrap max-lg:min-w-0 max-lg:w-full max-lg:flex-col max-lg:items-stretch max-lg:gap-0.5 max-lg:whitespace-normal'

export const compactFilterCountClass =
  'rounded-full bg-[#e8a317] px-1.5 py-0.5 text-[10px] font-bold text-[#1a3a6b] shadow-sm'

export const compactFilterLabelClass = 'compact-filter-label'

export const compactSearchWrapClass =
  'flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-[#8ec9a4] bg-white px-2 lg:flex-none'

export const compactSearchInputClass =
  'min-w-0 flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-[#6b9e7a] lg:w-36 lg:flex-none'

export function compactSelectClass(active: boolean, disabled = false, extra = '') {
  const base = `h-8 cursor-pointer rounded-md border px-2 py-1 text-xs outline-none transition-all focus:border-[#1a5c38] focus:ring-2 focus:ring-[#2d8a4e]/20 max-lg:w-full max-lg:min-w-0 max-lg:max-w-none ${extra}`
  if (disabled) return `${base} cursor-not-allowed border-[#dceee3] bg-slate-50 text-slate-400`
  if (active) return `${base} border-[#1a5c38] bg-[#ccebd6] font-semibold text-[#14532d] shadow-sm`
  return `${base} border-[#8ec9a4] bg-[#f4fbf7] text-slate-700 hover:border-[#2d8a4e] hover:bg-[#e8f6ed]`
}

export function compactClearClass(active: boolean) {
  return `flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-md border px-2 text-xs font-semibold transition-all sm:px-2.5 ${
    active
      ? 'border-[#1a5c38] bg-gradient-to-r from-[#1a5c38] to-[#2d8a4e] text-white shadow-sm'
      : 'border-[#8ec9a4] bg-white text-[#1a5c38] hover:border-[#2d8a4e] hover:bg-[#e8f6ed]'
  }`
}

export const compactClearLabelClass = 'hidden sm:inline'
