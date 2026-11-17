import { createFileRoute } from '@tanstack/react-router'
import { Activity, AlertTriangle, Building2, ClipboardList, UsersRound } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { PageHeader } from '@/components/app/PageHeader'
import { useStayOpsData } from '@/lib/data-context'
import type { TaskStatus } from '@/lib/domain'
import { useLanguage } from '@/lib/language'
import { localNationality } from '@/lib/nationality'

export const Route = createFileRoute('/app/analytics')({ component: AnalyticsPage })

type Tone = 'critical' | 'approval' | 'open' | 'progress' | 'draft' | 'resolved' | 'neutral'
type ChartValue = { label: string; value: number; tone?: Tone; hint?: string }

const STATUS_ORDER: Array<{ status: TaskStatus; tone: Tone; hintEn: string; hintZh: string }> = [
  { status: 'Escalated', tone: 'critical', hintEn: 'Needs immediate attention', hintZh: '需优先关注' },
  { status: 'Pending Approval', tone: 'approval', hintEn: 'Awaiting a decision', hintZh: '等待审批' },
  { status: 'Open', tone: 'open', hintEn: 'Awaiting action', hintZh: '等待处理' },
  { status: 'In Progress', tone: 'progress', hintEn: 'Being handled', hintZh: '正在处理' },
  { status: 'Draft Ready', tone: 'draft', hintEn: 'Ready for review', hintZh: '草稿待审核' },
  { status: 'Resolved', tone: 'resolved', hintEn: 'Completed', hintZh: '已完成' },
]

const TONE_STYLES: Record<Tone, { bar: string; dot: string }> = {
  critical: { bar: 'bg-red-700', dot: 'bg-red-700' },
  approval: { bar: 'bg-orange-700', dot: 'bg-orange-700' },
  open: { bar: 'bg-amber-600', dot: 'bg-amber-600' },
  progress: { bar: 'bg-sky-700', dot: 'bg-sky-700' },
  draft: { bar: 'bg-violet-700', dot: 'bg-violet-700' },
  resolved: { bar: 'bg-emerald-700', dot: 'bg-emerald-700' },
  neutral: { bar: 'bg-coffee', dot: 'bg-coffee' },
}

function AnalyticsPage() {
  const { data, raw, loading, error, refresh } = useStayOpsData()
  const { pick, tv } = useLanguage()
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />

  const unresolved = data.tasks.filter((task) => task.status !== 'Resolved')
  const urgentUnresolved = unresolved.filter((task) => task.urgent).length
  const statusCounts = countBy(data.tasks.map((task) => task.status))
  const typeCounts = countBy(data.tasks.map((task) => task.task_type))
  const knownStatuses = new Set<string>(STATUS_ORDER.map((item) => item.status))
  const statusValues: ChartValue[] = [
    ...STATUS_ORDER.map(({ status, tone, hintEn, hintZh }) => ({
      label: tv(status),
      value: statusCounts[status] || 0,
      tone,
      hint: pick(hintEn, hintZh),
    })),
    ...Object.entries(statusCounts)
      .filter(([status]) => !knownStatuses.has(status))
      .map(([status, value]) => ({ label: tv(status), value, tone: 'neutral' as const })),
  ]
  const propertyCounts = data.properties.map((property) => ({
    label: property.name,
    value: unresolved.filter((task) => task.property_id === property.property_id).length,
  })).sort((a, b) => b.value - a.value)
  const averageStay = data.customers.length
    ? data.customers.reduce((sum, customer) => sum + customer.duration_days, 0) / data.customers.length
    : 0

  // The display copy is translated to Chinese by DataProvider. Use raw values here so
  // the country is named in its own language in either UI mode.
  const nationalities = Object.entries(countBy(
    (raw?.customers ?? data.customers).map((customer) => localNationality(customer.nationality)),
  )).sort((a, b) => b[1] - a[1])
  const metrics = [
    { label: pick('Operating properties', '运营中的房源'), value: data.properties.filter((property) => property.status === 'Operating').length, icon: Building2 },
    { label: pick('Unresolved tasks', '未解决任务'), value: unresolved.length, icon: ClipboardList },
    { label: pick('Staff profiles', '员工档案'), value: data.users.length, icon: UsersRound },
    { label: pick('Logged actions', '已记录操作'), value: data.activityLogs.length, icon: Activity },
  ]

  return <>
    <PageHeader eyebrow="Analytics" title="Operations, made visible" description="Live patterns calculated from Properties, Users, Tasks, Customers and Activity Logs — no separate analytics database required." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
          <div className="flex items-center justify-between"><p className="text-sm text-stone">{label}</p><Icon className="size-5 text-champagne" aria-hidden="true" /></div>
          <p className="mt-3 font-display text-4xl font-semibold text-walnut">{value}</p>
        </div>
      ))}
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Chart
        title={pick('Task status', '任务状态')}
        subtitle={pick('Ordered by operational attention across every property', '按处理优先顺序展示所有房源的任务')}
        values={statusValues}
        notice={<div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span><strong>{urgentUnresolved}</strong> {pick('urgent unresolved tasks across all statuses', '项紧急且未解决的任务（可能属于任一状态）')}</span>
        </div>}
      />
      <Chart
        title={pick('Request mix', '请求类型构成')}
        subtitle={pick('What guests and staff need most often', '客人和员工最常见的需求')}
        values={Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label: tv(label), value }))}
      />
      <Chart
        title={pick('Unresolved work by property', '各房源未解决任务')}
        subtitle={pick('Where operational attention is concentrated', '运营关注点集中在哪里')}
        values={propertyCounts}
      />
      <section className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
        <p className="eyebrow text-champagne">{pick('Guest profile', '客人画像')}</p>
        <h2 className="mt-1 text-2xl font-semibold text-walnut">{pick('Stay insights', '入住洞察')}</h2>
        <div className="mt-5 rounded-2xl bg-ivory/70 p-4">
          <p className="text-sm text-stone">{pick('Average recorded stay', '平均入住时长')}</p>
          <p className="mt-1 font-display text-4xl font-semibold text-coffee">{averageStay.toFixed(1)} <span className="text-lg">{pick('days', '天')}</span></p>
        </div>
        <h3 className="mt-5 text-sm font-semibold text-walnut">{pick('Nationality · local country names', '国籍 · 当地语言名称')}</h3>
        <div className="mt-3 space-y-3">
          {nationalities.length ? nationalities.map(([label, value]) => (
            <div key={label} className="flex items-center justify-between border-b border-border pb-2 text-sm">
              <span className="text-charcoal">{label === 'Not recorded' ? pick('Not recorded', '未记录') : label}</span>
              <span className="font-semibold text-walnut">{value}</span>
            </div>
          )) : <p className="text-sm text-stone">{pick('No customer records yet.', '暂无客户记录。')}</p>}
        </div>
        <p className="mt-4 text-xs text-stone">{pick('Customer details are aggregated for operational planning; phone numbers and ID numbers are not displayed.', '客户信息仅汇总用于运营规划，不显示电话号码和证件号码。')}</p>
      </section>
    </div>
    <section className="mt-6 rounded-3xl border border-border bg-paper p-6 shadow-soft">
      <p className="eyebrow text-champagne">{pick('Coverage', '覆盖范围')}</p>
      <h2 className="mt-1 text-2xl font-semibold text-walnut">{pick('Portfolio snapshot', '房源概览')}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.properties.map((property) => (
          <div key={property.record_id} className="rounded-2xl bg-ivory/70 p-4">
            <p className="font-semibold text-walnut">{property.name}</p>
            <p className="text-sm text-stone">{property.location}</p>
            <p className="mt-2 text-xs text-coffee">{pick(
              String(unresolved.filter((task) => task.property_id === property.property_id).length) + ' unresolved tasks · ' + String(data.users.filter((user) => user.property_id === property.property_id).length) + ' staff',
              String(unresolved.filter((task) => task.property_id === property.property_id).length) + ' 个未解决任务 · ' + String(data.users.filter((user) => user.property_id === property.property_id).length) + ' 名员工',
            )}</p>
          </div>
        ))}
      </div>
    </section>
  </>
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] || 0) + 1
    return counts
  }, {})
}

function Chart({ title, subtitle, values, notice }: {
  title: string
  subtitle: string
  values: ChartValue[]
  notice?: React.ReactNode
}) {
  const { pick } = useLanguage()
  const max = Math.max(1, ...values.map((item) => item.value))
  return <section className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
    <p className="eyebrow text-champagne">{pick('Live distribution', '实时分布')}</p>
    <h2 className="mt-1 text-2xl font-semibold text-walnut">{title}</h2>
    <p className="text-sm text-stone">{subtitle}</p>
    {notice && <div className="mt-5">{notice}</div>}
    <div className="mt-5 space-y-4">
      {values.length ? values.map((item) => {
        const tone = TONE_STYLES[item.tone || 'neutral']
        return <div key={item.label}>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-charcoal">
              <span className={'size-2.5 shrink-0 rounded-full ' + tone.dot} aria-hidden="true" />
              <span className="font-medium">{item.label}</span>
              {item.hint && <span className="text-xs text-stone">{item.hint}</span>}
            </span>
            <span className="font-semibold tabular-nums text-walnut">{item.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-sand/35" aria-hidden="true">
            <div className={'h-full rounded-full ' + tone.bar} style={{ width: String(Math.max(item.value ? 6 : 0, item.value / max * 100)) + '%' }} />
          </div>
        </div>
      }) : <p className="text-sm text-stone">{pick('No records yet.', '暂无记录。')}</p>}
    </div>
  </section>
}
