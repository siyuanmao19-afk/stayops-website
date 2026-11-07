import { createFileRoute } from '@tanstack/react-router'
import { Bot, Cog, UserRound } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { EmptyState, PageHeader } from '@/components/app/PageHeader'
import { useStayOpsData } from '@/lib/data-context'
import { useLanguage } from '@/lib/language'
import type { Actor } from '@/lib/domain'

export const Route = createFileRoute('/app/activity')({ component: ActivityPage })
const ACTOR: Record<Actor, { icon: typeof Bot; cls: string }> = { AI: { icon: Bot, cls: 'bg-champagne text-walnut' }, Staff: { icon: UserRound, cls: 'bg-sage text-paper' }, System: { icon: Cog, cls: 'bg-stone text-paper' } }
const FMT = {
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }),
  zh: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }),
}

function ActivityPage() {
  const { data, loading, error, refresh } = useStayOpsData()
  const { language, pick, tv } = useLanguage()
  const fmt = FMT[language]
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />
  const logs = [...data.activityLogs].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return <>
    <PageHeader eyebrow="Activity Logs" title="A clear audit trail" description="Live AI analyses, staff edits and system changes from Softr." />
    <div className="mb-6 flex flex-wrap gap-4 text-sm text-stone">{(Object.keys(ACTOR) as Actor[]).map((actor) => { const { icon: Icon, cls } = ACTOR[actor]; return <span key={actor} className="inline-flex items-center gap-2"><span className={`grid size-6 place-items-center rounded-full ${cls}`}><Icon className="size-3.5" aria-hidden="true" /></span>{tv(actor)}</span> })}</div>
    {logs.length === 0 ? <EmptyState icon={<Cog className="size-5" />} title="No activity yet" body="Task edits and AI analyses will appear here." /> : <ol className="relative space-y-4 border-l border-champagne/40 pl-8">{logs.map((log) => { const { icon: Icon, cls } = ACTOR[log.actor]; const task = data.tasks.find((item) => item.id === log.task_id); return <li key={log.record_id} className="relative"><span className={`absolute -left-12 top-4 grid size-8 place-items-center rounded-full ring-4 ring-ivory ${cls}`}><Icon className="size-4" aria-label={tv(log.actor)} /></span><div className="rounded-3xl border border-border bg-paper p-5 shadow-soft"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="whitespace-pre-line font-medium text-walnut">{log.action}</p><time dateTime={log.created_at} className="text-xs text-stone">{fmt.format(new Date(log.created_at))}</time></div><p className="mt-1 text-sm text-stone">{log.actor_name} · <span className="font-mono text-xs">{log.task_id}</span>{task ? ` — ${task.title}` : ''}</p></div></li> })}</ol>}
  </>
}


