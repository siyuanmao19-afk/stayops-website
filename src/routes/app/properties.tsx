import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ImageOff, MapPin } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { EmptyState, PageHeader } from '@/components/app/PageHeader'
import { StatusDot } from '@/components/home/LocationGraph'
import { useStayOpsData } from '@/lib/data-context'
import { useLanguage } from '@/lib/language'

export const Route = createFileRoute('/app/properties')({ component: PropertiesPage })

function PropertyImage({ src, name, id }: { src: string; name: string; id: string }) {
  const { pick } = useLanguage()
  const [failedUrl, setFailedUrl] = useState('')

  return <div className="relative h-44 overflow-hidden bg-[radial-gradient(120%_100%_at_20%_0%,#5B3825_0%,#3A2418_60%,#211812_100%)]">
    {src && failedUrl !== src ? (
      <img src={src} alt={pick(`Photo of ${name}`, `${name}的照片`)} loading="lazy" decoding="async" onError={() => setFailedUrl(src)} className="h-full w-full object-cover" />
    ) : (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sand/90">
        <ImageOff className="size-8 text-champagne" aria-hidden="true" />
        <span className="text-sm font-medium">{pick('Photo not available yet', '暂无房源照片')}</span>
      </div>
    )}
    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/80 to-transparent p-4 pt-8">
      <span className="font-mono text-xs text-paper">{id}</span>
    </div>
  </div>
}

function PropertiesPage() {
  const { data, loading, error, refresh } = useStayOpsData()
  const { pick } = useLanguage()
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />
  return (
    <>
      <PageHeader eyebrow="Properties" title="Your houses" description="Live property records and the work currently waiting at each homestay." />
      {data.properties.length === 0 ? <EmptyState icon={<MapPin className="size-5" />} title={pick('No properties yet', '暂无房源')} body={pick('Properties will appear here when records are available.', '房源记录可用后会显示在这里。')} /> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {data.properties.map((property) => {
          const tasks = data.tasks.filter((task) => task.property_id === property.property_id && task.status !== 'Resolved')
          return <article key={property.record_id} className="overflow-hidden rounded-3xl border border-border bg-paper shadow-soft">
            <PropertyImage src={property.image_url} name={property.name} id={property.property_id} />
            <div className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="text-2xl font-semibold leading-tight text-walnut">{property.name}</h2><StatusDot status={property.status} /></div><p className="mt-1 flex items-center gap-1.5 text-sm text-stone"><MapPin className="size-3.5" aria-hidden="true" /> {property.location}</p><div className="mt-4 border-t border-border pt-4"><p className="eyebrow text-champagne">{pick('Current tasks', '当前任务')}</p>{tasks.length === 0 ? <p className="mt-1.5 text-sm text-stone">{pick('Nothing waiting — all calm.', '暂无待办，一切顺利。')}</p> : <ul className="mt-1.5 space-y-1 text-sm text-charcoal">{tasks.slice(0, 4).map((task) => <li key={task.record_id}>· {task.title}</li>)}</ul>}</div></div>
          </article>
        })}
      </div>}
    </>
  )
}



