import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { ApprovalTag, EmptyState, PageHeader, TypeBadge } from '@/components/app/PageHeader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStayOpsData } from '@/lib/data-context'
import { useLanguage } from '@/lib/language'
import { TASK_TYPES } from '@/lib/domain'

export const Route = createFileRoute('/app/procedures')({ component: ProceduresPage })

function ProceduresPage() {
  const { data, loading, error, refresh, propertyById } = useStayOpsData()
  const { pick, tv } = useLanguage()
  const [q, setQ] = useState('')
  const [propertyId, setPropertyId] = useState('all')
  const [type, setType] = useState('all')
  const list = useMemo(() => {
    const search = q.trim().toLowerCase()
    return (data?.procedures || []).filter((item) => (propertyId === 'all' || item.property_id === propertyId) && (type === 'all' || item.task_type === type) && (!search || `${item.procedure_id} ${item.title} ${item.instructions.join(' ')}`.toLowerCase().includes(search)))
  }, [data, q, propertyId, type])
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />
  return <>
    <PageHeader eyebrow="Procedures" title="House rules, written down" description="Live, property-specific operating procedures and approval boundaries." />
    <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-paper p-4 shadow-soft sm:grid-cols-[1.5fr_1fr_1fr]">
      <div className="relative"><Label htmlFor="proc-search" className="sr-only">{pick('Search procedures', '搜索操作规范')}</Label><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden="true" /><Input id="proc-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder={pick('Search by ID, title or step…', '按编号、标题或步骤搜索……')} className="h-10 rounded-xl bg-ivory/50 pl-9" /></div>
      <Select value={propertyId} onValueChange={setPropertyId}><SelectTrigger aria-label={pick('Property', '房源')} className="h-10 w-full rounded-xl bg-ivory/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{pick('All properties', '全部房源')}</SelectItem>{data.properties.map((property) => <SelectItem key={property.record_id} value={property.property_id}>{property.name}</SelectItem>)}</SelectContent></Select>
      <Select value={type} onValueChange={setType}><SelectTrigger aria-label={pick('Task type', '任务类型')} className="h-10 w-full rounded-xl bg-ivory/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{pick('All task types', '全部任务类型')}</SelectItem>{TASK_TYPES.map((taskType) => <SelectItem key={taskType} value={taskType}>{tv(taskType)}</SelectItem>)}</SelectContent></Select>
    </div>
    {list.length === 0 ? <EmptyState icon={<ScrollText className="size-5" />} title="No procedures found" body="This property may not have a written procedure for that request yet." /> : <div className="grid gap-5 md:grid-cols-2">{list.map((item) => <article key={item.record_id} className="flex flex-col rounded-3xl border border-border bg-paper p-6 shadow-soft"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg bg-walnut px-2 py-0.5 font-mono text-xs text-sand">{item.procedure_id}</span><TypeBadge type={item.task_type} /></div><h2 className="mt-3 text-2xl font-semibold text-walnut">{item.title}</h2><p className="text-sm text-stone">{propertyById(item.property_id)?.name || item.property_id}</p><ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-charcoal">{item.instructions.map((step) => <li key={step}>{step}</li>)}</ol><div className="mt-auto pt-5"><ApprovalTag level={item.approval_level} rule={item.approval_rule} /></div></article>)}</div>}
  </>
}


