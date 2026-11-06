import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, ClipboardList, Hourglass, Sparkles, Wrench } from 'lucide-react'
import { PageHeader, StatusBadge, TypeBadge } from '@/components/app/PageHeader'
import { RichText } from '@/components/brand/RichText'
import { StatusDot } from '@/components/home/LocationGraph'
import { DEMO_ACTIVITY_LOGS, DEMO_PROPERTIES, DEMO_TASKS, propertyById } from '@/lib/fixtures'

export const Route = createFileRoute('/app/')({
  component: OverviewPage,
})

function OverviewPage() {
  const open = DEMO_TASKS.filter((t) => t.status !== 'Done')
  const awaiting = DEMO_TASKS.filter((t) => t.status === 'Awaiting Approval')
  const urgent = DEMO_TASKS.filter((t) => t.urgent && t.status !== 'Done')
  const latestAi = DEMO_ACTIVITY_LOGS.filter((l) => l.actor === 'AI')[0]
  const latestTask = latestAi ? DEMO_TASKS.find((t) => t.id === latestAi.task_id) : undefined

  const tiles = [
    { label: 'Open tasks', value: open.length, icon: ClipboardList, tone: 'text-walnut' },
    { label: 'Awaiting approval', value: awaiting.length, icon: Hourglass, tone: 'text-coffee' },
    { label: 'Urgent maintenance', value: urgent.length, icon: Wrench, tone: 'text-terracotta' },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Today at a glance"
        description="What needs attention across your homestays today."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-stone">{label}</p>
              <Icon className={`size-5 ${tone}`} aria-hidden="true" />
            </div>
            <p className={`mt-3 font-display text-5xl font-semibold ${tone}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="needs" className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 id="needs" className="text-2xl font-semibold text-walnut">Needs attention</h2>
            <Link to="/app/tasks" className="inline-flex items-center gap-1 text-sm font-medium text-coffee hover:text-walnut">
              All tasks <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {open.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-walnut">
                    {t.urgent && <AlertTriangle className="size-4 text-terracotta" aria-label="Urgent" />}
                    {t.title}
                  </p>
                  <p className="text-xs text-stone">{propertyById(t.property_id)?.name} · {t.assigned_to}</p>
                </div>
                <div className="flex gap-2">
                  <TypeBadge type={t.task_type} />
                  <StatusBadge status={t.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-6">
          {latestTask && (
            <section aria-labelledby="latest" className="rounded-3xl bg-walnut p-6 text-sand shadow-lift">
              <p className="eyebrow flex items-center gap-2 text-champagne">
                <Sparkles className="size-3.5" aria-hidden="true" /> Latest AI analysis
              </p>
              <h2 id="latest" className="mt-2 text-2xl font-semibold text-paper">{latestTask.title}</h2>
              <p className="mt-2 text-sm text-sand/85 [&_strong]:text-paper">
                <RichText text={latestTask.ai_summary} />
              </p>
              <Link to="/app/assistant" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-champagne hover:text-sand">
                Ask about a new request <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </section>
          )}
          <section aria-labelledby="props" className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
            <h2 id="props" className="text-2xl font-semibold text-walnut">Property status</h2>
            <ul className="mt-3 space-y-2.5">
              {DEMO_PROPERTIES.map((p) => (
                <li key={p.property_id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate text-charcoal">{p.name}</span>
                  <StatusDot status={p.status} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
