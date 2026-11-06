import { cn } from '@/lib/utils'

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-8 shrink-0">
        <rect width="32" height="32" rx="10" fill={light ? '#E8D4AE' : '#3A2418'} />
        <path
          d="M8 16.5 16 9.5l8 7"
          fill="none"
          stroke={light ? '#3A2418' : '#C69A52'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M11 15.5V23h10v-7.5"
          fill="none"
          stroke={light ? '#3A2418' : '#E8D4AE'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="19" r="1.6" fill={light ? '#3A2418' : '#C69A52'} />
      </svg>
      <span
        className={cn(
          'font-display text-[1.45rem] font-semibold leading-none tracking-tight',
          light ? 'text-sand' : 'text-walnut',
        )}
      >
        StayOps
      </span>
    </span>
  )
}
