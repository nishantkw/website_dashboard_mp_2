import clsx from 'clsx'
import type { ReactNode } from 'react'

type StackedHeadingSize = 'page' | 'section' | 'filter'

/** Prevents § symbols and long FRS labels from clipping in tight containers. */
const textSafe = 'break-words [overflow-wrap:anywhere] [line-height:1.6] py-0.5'

const sizeStyles: Record<
  StackedHeadingSize,
  { wrap: string; title: string; subtitle: string }
> = {
  page: {
    wrap: 'flex min-w-0 flex-col gap-2 overflow-visible',
    title: clsx('text-2xl font-bold text-gray-900', textSafe),
    subtitle: clsx('block text-sm text-gray-500', textSafe),
  },
  section: {
    wrap: 'flex min-w-0 flex-col gap-2 overflow-visible',
    title: clsx('text-sm font-semibold text-slate-800', textSafe),
    subtitle: clsx('block text-xs text-slate-500', textSafe),
  },
  filter: {
    wrap: 'flex min-w-0 flex-col gap-1.5 overflow-visible',
    title: clsx('text-xs font-bold text-[#1a5c38]', textSafe),
    subtitle: clsx('block text-xs text-[#4a7c59]', textSafe),
  },
}

interface StackedHeadingProps {
  title: string
  subtitle?: string
  size?: StackedHeadingSize
  titleAs?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  badge?: ReactNode
  className?: string
  titleClassName?: string
  subtitleClassName?: string
}

export default function StackedHeading({
  title,
  subtitle,
  size = 'section',
  titleAs = 'h3',
  badge,
  className,
  titleClassName,
  subtitleClassName,
}: StackedHeadingProps) {
  const styles = sizeStyles[size]
  const TitleTag = titleAs

  return (
    <div className={clsx(styles.wrap, className)}>
      <TitleTag className={clsx(styles.title, titleClassName)}>{title}</TitleTag>
      {subtitle ? (
        <p className={clsx('m-0 max-w-full', styles.subtitle, subtitleClassName)}>
          {subtitle}
        </p>
      ) : null}
      {badge ? <div className="flex flex-wrap items-center gap-2 pt-1">{badge}</div> : null}
    </div>
  )
}
