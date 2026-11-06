import { FlaskConical } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DemoBadge({ label = 'Demo data', className }: { label?: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-champagne/40 bg-sand/40 px-2.5 py-1 text-xs font-medium text-coffee',
        className,
      )}
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  )
}
