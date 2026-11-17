import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Bot, Cog, Search, UserRound, X } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { EmptyState, PageHeader } from '@/components/app/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useStayOpsData } from '@/lib/data-context'
import { useLanguage } from '@/lib/language'
import type { Actor, Task } from '@/lib/domain'

export const Route = createFileRoute('/app/activity')({ component: ActivityPage })

const ALL = 'all'
const ACTOR: Record<Actor, { icon: typeof Bot; cls: string }> = {
  AI: { icon: Bot, cls: 'bg-champagne text-walnut' },
  Staff: { icon: UserRound, cls: 'bg-sage text-paper' },
  System: { icon: Cog, cls: 'bg-stone text-paper' },
}
const FMT = {
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }),
  zh: new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' }),
}
const DAY_FMT = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
})

function dayKey(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = DAY_FMT.formatToParts(date)
  const part = (type: string) => parts.find((item) => item.type === type)?.value || ''
  return `${part('year')}-${part('month')}-${part('day')}`
}

function taskForLog(tasks: Task[], taskId: string) {
  return tasks.find((task) => task.id === taskId || task.record_id === taskId)
}

function ActivityPage() {
  const { data, raw, loading, error, refresh } = useStayOpsData()
  const { language, pick, tv } = useLanguage()
  const [query, setQuery] = useState('')
  const [propertyId, setPropertyId] = useState(ALL)
  const [source, setSource] = useState(ALL)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const fmt = FMT[language]

  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />

  const needle = query.trim().toLocaleLowerCase()
  const hasFilters = Boolean(needle || fromDate || toDate || propertyId !== ALL || source !== ALL)
  const logs = [...data.activityLogs]
    .filter((log) => {
      const task = taskForLog(data.tasks, log.task_id)
      const originalTask = raw && taskForLog(raw.tasks, log.task_id)
      const property = data.properties.find((item) => item.property_id === task?.property_id)
      const originalProperty = raw?.properties.find((item) => item.property_id === task?.property_id)
      const originalLog = raw?.activityLogs.find((item) => item.record_id === log.record_id)
      const day = dayKey(log.created_at)
      if (propertyId !== ALL && task?.property_id !== propertyId) return false
      if (source !== ALL && log.actor !== source) return false
      if (fromDate && (!day || day < fromDate)) return false
      if (toDate && (!day || day > toDate)) return false
      if (!needle) return true
      return [
        log.id, log.task_id, log.action, log.actor_name,
        originalLog?.action,
        task?.id, task?.title, task?.description,
        originalTask?.title, originalTask?.description,
        property?.property_id, property?.name, property?.location,
        originalProperty?.name, originalProperty?.location,
      ].filter(Boolean).join(' ').toLocaleLowerCase().includes(needle)
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  function clearFilters() {
    setQuery('')
    setPropertyId(ALL)
    setSource(ALL)
    setFromDate('')
    setToDate('')
  }

  return <>
    <PageHeader eyebrow="Activity Logs" title="A clear audit trail" description="Live AI analyses, staff edits and system changes from Softr." />

    <div className="mb-6 space-y-4 rounded-3xl border border-border bg-paper p-4 shadow-soft sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Label htmlFor="activity-search" className="mb-1.5 block text-xs text-stone">{pick('Keyword, task ID or room', '关键词、任务号或房间号')}</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden="true" />
            <Input id="activity-search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder={pick('Search actions, task IDs, rooms…', '搜索操作、任务号、房间号……')}
              className="h-10 rounded-xl bg-ivory/50 pl-9" />
          </div>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-stone">{pick('Property', '房源')}</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger aria-label={pick('Filter by property', '按房源筛选')} className="h-10 w-full rounded-xl bg-ivory/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{pick('All properties', '全部房源')}</SelectItem>
              {data.properties.map((item) => <SelectItem key={item.property_id} value={item.property_id}>{item.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1.5 block text-xs text-stone">{pick('Source', '来源')}</Label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger aria-label={pick('Filter by source', '按来源筛选')} className="h-10 w-full rounded-xl bg-ivory/50"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{pick('All sources', '全部来源')}</SelectItem>
              {(Object.keys(ACTOR) as Actor[]).map((actor) => <SelectItem key={actor} value={actor}>{tv(actor)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="activity-from" className="mb-1.5 block text-xs text-stone">{pick('From date', '开始日期')}</Label>
          <Input id="activity-from" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="h-10 w-44 rounded-xl bg-ivory/50" />
        </div>
        <div>
          <Label htmlFor="activity-to" className="mb-1.5 block text-xs text-stone">{pick('To date', '结束日期')}</Label>
          <Input id="activity-to" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="h-10 w-44 rounded-xl bg-ivory/50" />
        </div>
        {hasFilters && <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="h-10 rounded-xl text-stone"><X className="size-4" />{pick('Clear filters', '清除筛选')}</Button>}
      </div>
    </div>

    <p className="mb-5 text-sm text-stone" aria-live="polite">
      {pick(`${logs.length} of ${data.activityLogs.length} records`, `显示 ${logs.length} / ${data.activityLogs.length} 条记录`)}
    </p>

    {logs.length === 0 ? (
      hasFilters
        ? <EmptyState icon={<Search className="size-5" />} title={pick('No matching activity', '没有符合条件的活动记录')} body={pick('Try another keyword or clear the filters.', '试试其他关键词或清除筛选条件。')} />
        : <EmptyState icon={<Cog className="size-5" />} title="No activity yet" body="Task edits and AI analyses will appear here." />
    ) : (
      <ol className="relative space-y-4 border-l border-champagne/40 pl-8">
        {logs.map((log) => {
          const { icon: Icon, cls } = ACTOR[log.actor] || ACTOR.Staff
          const task = taskForLog(data.tasks, log.task_id)
          const property = data.properties.find((item) => item.property_id === task?.property_id)
          const date = new Date(log.created_at)
          return <li key={log.record_id} className="relative">
            <span className={`absolute -left-12 top-4 grid size-8 place-items-center rounded-full ring-4 ring-ivory ${cls}`}><Icon className="size-4" aria-label={tv(log.actor)} /></span>
            <div className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="whitespace-pre-line font-medium text-walnut">{log.action}</p>
                <time dateTime={log.created_at} className="text-xs text-stone">{Number.isNaN(date.getTime()) ? log.created_at : fmt.format(date)}</time>
              </div>
              <p className="mt-1 text-sm text-stone">{log.actor_name} · <span className="font-mono text-xs">{log.task_id}</span>{task ? ` — ${task.title}` : ''}</p>
              {property && <p className="mt-1 text-xs text-stone">{property.name} · {property.property_id}</p>}
            </div>
          </li>
        })}
      </ol>
    )}
  </>
}

