import { createFileRoute, Link } from '@tanstack/react-router'
import { AlertTriangle, ArrowRight, ClipboardList, Hourglass, Sparkles, Wrench } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { PageHeader, StatusBadge, TypeBadge } from '@/components/app/PageHeader'
import { RichText } from '@/components/brand/RichText'
import { StatusDot } from '@/components/home/LocationGraph'
import { useStayOpsData } from '@/lib/data-context'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/language'

export const Route = createFileRoute('/app/')({ component: OverviewPage })

function OverviewPage() {
  const { user } = useAuth()
  const manager = user?.email?.toLowerCase() === 'siyuanmao19@gmail.com'
  const { data, loading, error, refresh, propertyById } = useStayOpsData()
  const { pick, tv } = useLanguage()
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />
  // Match the Tasks status filter exactly; the attention list below includes all unresolved statuses.
  const open = data.tasks.filter((task) => task.status === 'Open')
  const awaiting = data.tasks.filter((task) => task.status === 'Pending Approval')
  const urgent = data.tasks.filter((task) => task.urgent && task.status !== 'Resolved')
  const needsAttention = data.tasks.filter((task) => task.status !== 'Resolved')
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.created_at.localeCompare(a.created_at))
  const latestAi = [...data.activityLogs].filter((log) => log.actor === 'AI').sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const latestTask = latestAi ? data.tasks.find((task) => task.id === latestAi.task_id) : undefined
  const tiles = [
    { label: pick('Open tasks', '待处理任务'), value: open.length, icon: ClipboardList, tone: 'text-walnut', search: { status: 'Open' as const } },
    { label: pick('Pending approval', '等待审批'), value: awaiting.length, icon: Hourglass, tone: 'text-coffee', search: { status: 'Pending Approval' as const } },
    { label: pick('Urgent attention', '紧急关注'), value: urgent.length, icon: Wrench, tone: 'text-terracotta', search: { priority: 'urgent' as const } },
  ]
  return (
    <>
      <PageHeader eyebrow="Overview" title="Today at a glance" description={manager ? 'Live operations across every StayOps property.' : 'Your assigned tasks and recent activity.'} />
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, tone, search }) => <Link key={label} to="/app/tasks" search={search} aria-label={pick(`View ${label} in Tasks`, `在任务页面查看${label}`)} className="group rounded-3xl border border-border bg-paper p-6 shadow-soft transition hover:border-champagne hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-walnut"><div className="flex items-center justify-between"><p className="text-sm font-medium text-stone">{label}</p><Icon className={`size-5 ${tone}`} aria-hidden="true" /></div><div className="mt-3 flex items-end justify-between gap-2"><p className={`font-display text-5xl font-semibold ${tone}`}>{value}</p><ArrowRight className="size-5 text-stone transition group-hover:translate-x-1 group-hover:text-walnut" aria-hidden="true" /></div></Link>)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="needs" className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
          <div className="flex items-center justify-between"><h2 id="needs" className="text-2xl font-semibold text-walnut">{pick('Needs attention', '需要关注')}</h2><Link to="/app/tasks" className="inline-flex items-center gap-1 text-sm font-medium text-coffee hover:text-walnut">{pick('All tasks', '全部任务')} <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
          {needsAttention.length ? <ul className="mt-4 divide-y divide-border">{needsAttention.slice(0, 8).map((task) => <li key={task.record_id} className="flex flex-wrap items-center justify-between gap-3 py-3.5"><div className="min-w-0"><p className="flex items-center gap-2 font-medium text-walnut">{task.urgent && <AlertTriangle className="size-4 text-terracotta" aria-label={pick('Urgent', '紧急')} />}{task.title}</p><p className="text-xs text-stone">{propertyById(task.property_id)?.name || task.property_id} · {tv(task.assigned_to)}</p></div><div className="flex gap-2"><TypeBadge type={task.task_type} /><StatusBadge status={task.status} /></div></li>)}</ul> : <p className="mt-6 text-sm text-stone">{pick('Everything is resolved — the operation is calm.', '所有任务均已解决，运营一切平稳。')}</p>}
        </section>
        <div className="space-y-6">
          {latestTask && <section aria-labelledby="latest" className="rounded-3xl bg-walnut p-6 text-sand shadow-lift"><p className="eyebrow flex items-center gap-2 text-champagne"><Sparkles className="size-3.5" aria-hidden="true" /> {pick('Latest AI analysis', '最新 AI 分析')}</p><h2 id="latest" className="mt-2 text-2xl font-semibold text-paper">{latestTask.title}</h2><p className="mt-2 text-sm text-sand/85 [&_strong]:text-paper"><RichText text={latestTask.ai_summary || latestTask.description} /></p><Link to="/app/assistant" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-champagne hover:text-sand">{pick('Ask about a new request', '分析新的客人请求')} <ArrowRight className="size-4" aria-hidden="true" /></Link></section>}
          <section aria-labelledby="props" className="rounded-3xl border border-border bg-paper p-6 shadow-soft"><h2 id="props" className="text-2xl font-semibold text-walnut">{pick('Property status', '房源状态')}</h2><ul className="mt-3 space-y-2.5">{data.properties.map((property) => <li key={property.record_id} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-charcoal">{property.name}</span><StatusDot status={property.status} /></li>)}</ul></section>
        </div>
      </div>
    </>
  )
}



