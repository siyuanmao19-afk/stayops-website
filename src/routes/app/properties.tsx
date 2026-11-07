import { createFileRoute } from '@tanstack/react-router'
import { MapPin } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { PageHeader } from '@/components/app/PageHeader'
import { StatusDot } from '@/components/home/LocationGraph'
import { useStayOpsData } from '@/lib/data-context'
import { useLanguage } from '@/lib/language'

export const Route = createFileRoute('/app/properties')({ component: PropertiesPage })

function PropertiesPage() {
  const { data, loading, error, refresh } = useStayOpsData()
  const { pick } = useLanguage()
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />
  return (
    <>
      <PageHeader eyebrow="Properties" title="Your houses" description="Live property records and the work currently waiting at each homestay." />
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {data.properties.map((property) => {
          const tasks = data.tasks.filter((task) => task.property_id === property.property_id && task.status !== 'Resolved')
          return <article key={property.record_id} className="overflow-hidden rounded-3xl border border-border bg-paper shadow-soft">
            <div className="relative flex h-36 items-end bg-[radial-gradient(120%_100%_at_20%_0%,#5B3825_0%,#3A2418_60%,#211812_100%)] p-5"><svg viewBox="0 0 120 60" className="absolute right-4 top-4 h-14 w-28 text-champagne/30" aria-hidden="true"><path d="M10 50 40 22l20 16 22-24 28 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg><span className="font-mono text-xs text-sand/70">{property.property_id}</span></div>
            <div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-semibold leading-tight text-walnut">{property.name}</h2><StatusDot status={property.status} /></div><p className="mt-1 flex items-center gap-1.5 text-sm text-stone"><MapPin className="size-3.5" aria-hidden="true" /> {property.location}</p><div className="mt-4 border-t border-border pt-4"><p className="eyebrow text-champagne">{pick('Current tasks', '当前任务')}</p>{tasks.length === 0 ? <p className="mt-1.5 text-sm text-stone">{pick('Nothing waiting — all calm.', '暂无待办，一切顺利。')}</p> : <ul className="mt-1.5 space-y-1 text-sm text-charcoal">{tasks.slice(0, 4).map((task) => <li key={task.record_id}>· {task.title}</li>)}</ul>}</div></div>
          </article>
        })}
      </div>
    </>
  )
}


