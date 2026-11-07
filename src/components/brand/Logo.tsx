import { cn } from '@/lib/utils'

/** StayOps wordmark (roof + window + swoosh). Transparent PNG, sized by height. */
export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/img/stayops-logo-mark.png"
      alt="StayOps"
      width={320}
      height={128}
      decoding="async"
      className={cn('block h-9 w-auto select-none', className)}
      draggable={false}
    />
  )
}
