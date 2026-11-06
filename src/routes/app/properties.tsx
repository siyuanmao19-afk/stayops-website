import { createFileRoute } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusDot } from '@/components/home/LocationGraph'
import { DEMO_PROPERTIES, DEMO_TASKS } from '@/lib/fixtures'

export const Route = createFileRoute('/app/properties')({
  component: PropertiesPage,
})

function PropertiesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Properties"
        title="Your houses"
        description="Each homestay, where it is, how it’s operating and what is waiting for the team."
      />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_PROPERTIES.map((p) => {
          const tasks = DEMO_TASKS.filter((t) => t.property_id === p.property_id && t.status !== 'Done')
          return (
            <article key={p.property_id} className="overflow-hidden rounded-3xl border border-border bg-paper shadow-soft">
              {/* Brand placeholder until a property photo is added */}
              <div className="relative flex h-36 items-end bg-[radial-gradient(120%_100%_at_20%_0%,#5B3825_0%,#3A2418_60%,#211812_100%)] p-5">
                <svg viewBox="0 0 120 60" className="absolute right-4 top-4 h-14 w-28 text-champagne/30" aria-hidden="true">
                  <path d="M10 50 40 22l20 16 22-24 28 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
                <span className="font-mono text-xs text-sand/70">{p.property_id}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-semibold leading-tight text-walnut">{p.name}</h2>
                  <StatusDot status={p.status} />
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone">
                  <MapPin className="size-3.5" aria-hidden="true" /> {p.city}, {p.province}
                </p>
                <div className="mt-4 border-t border-border pt-4">
                  <p className="eyebrow text-champagne">Current tasks</p>
                  {tasks.length === 0 ? (
                    <p className="mt-1.5 text-sm text-stone">Nothing waiting — all calm.</p>
                  ) : (
                    <ul className="mt-1.5 space-y-1 text-sm text-charcoal">
                      {tasks.map((t) => <li key={t.id}>· {t.title}</li>)}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
