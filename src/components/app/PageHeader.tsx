import { DemoBadge } from '@/components/brand/DemoBadge'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow text-champagne">{eyebrow}</p>
          <DemoBadge />
        </div>
        <h1 className="mt-2 text-4xl font-semibold text-walnut sm:text-5xl">{title}</h1>
        <p className="mt-2 text-stone">{description}</p>
      </div>
      {actions}
    </div>
  )
}

export function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-champagne/40 bg-paper/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-sand/40 text-coffee">{icon}</span>
      <p className="mt-4 font-display text-2xl font-semibold text-walnut">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-stone">{body}</p>
    </div>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    Safety: 'bg-terracotta/12 text-terracotta border-terracotta/25',
    Maintenance: 'bg-champagne/15 text-coffee border-champagne/30',
    Housekeeping: 'bg-sage/15 text-sage border-sage/30',
    Booking: 'bg-walnut/8 text-walnut border-walnut/15',
    'Guest Enquiry': 'bg-sand/40 text-coffee border-sand',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? 'border-border text-stone'}`}>
      {type}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    New: 'bg-paper text-walnut border-walnut/20',
    'In Progress': 'bg-champagne/15 text-coffee border-champagne/30',
    'Awaiting Approval': 'bg-terracotta/10 text-terracotta border-terracotta/25',
    Done: 'bg-sage/15 text-sage border-sage/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'border-border text-stone'}`}>
      {status}
    </span>
  )
}

export function ApprovalTag({ level, rule }: { level: 'none' | 'manager' | 'owner'; rule: string }) {
  const cls =
    level === 'owner'
      ? 'bg-terracotta/10 text-terracotta border-terracotta/25'
      : level === 'manager'
        ? 'bg-champagne/15 text-coffee border-champagne/35'
        : 'bg-sage/15 text-sage border-sage/30'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {rule}
    </span>
  )
}
