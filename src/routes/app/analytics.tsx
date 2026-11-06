import { createFileRoute } from '@tanstack/react-router'
import { Activity, Building2, ClipboardList, UsersRound } from 'lucide-react'
import { DataState } from '@/components/app/DataState'
import { PageHeader } from '@/components/app/PageHeader'
import { useStayOpsData } from '@/lib/data-context'

export const Route = createFileRoute('/app/analytics')({ component: AnalyticsPage })

function AnalyticsPage() {
  const { data, loading, error, refresh } = useStayOpsData()
  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || 'No data returned.'} retry={refresh} />

  const open = data.tasks.filter((task) => task.status !== 'Resolved')
  const statusCounts = countBy(data.tasks.map((task) => task.status))
  const typeCounts = countBy(data.tasks.map((task) => task.task_type))
  const propertyCounts = data.properties.map((property) => ({
    label: property.name,
    value: open.filter((task) => task.property_id === property.property_id).length,
  })).sort((a, b) => b.value - a.value)
  const averageStay = data.customers.length
    ? data.customers.reduce((sum, customer) => sum + customer.duration_days, 0) / data.customers.length
    : 0
  const nationalities = countBy(data.customers.map((customer) => customer.nationality || 'Not recorded'))
  const metrics = [
    { label: 'Operating properties', value: data.properties.filter((property) => property.status === 'Operating').length, icon: Building2 },
    { label: 'Open tasks', value: open.length, icon: ClipboardList },
    { label: 'Staff profiles', value: data.users.length, icon: UsersRound },
    { label: 'Logged actions', value: data.activityLogs.length, icon: Activity },
  ]

  return <>
    <PageHeader eyebrow="Analytics" title="Operations, made visible" description="Live patterns calculated from Properties, Users, Tasks, Customers and Activity Logs — no separate analytics database required." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <div key={label} className="rounded-3xl border border-border bg-paper p-5 shadow-soft"><div className="flex items-center justify-between"><p className="text-sm text-stone">{label}</p><Icon className="size-5 text-champagne" aria-hidden="true" /></div><p className="mt-3 font-display text-4xl font-semibold text-walnut">{value}</p></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Chart title="Task status" subtitle="Current distribution across every property" values={Object.entries(statusCounts).map(([label, value]) => ({ label, value }))} />
      <Chart title="Request mix" subtitle="What guests and staff need most often" values={Object.entries(typeCounts).map(([label, value]) => ({ label, value }))} />
      <Chart title="Open work by property" subtitle="Where operational attention is concentrated" values={propertyCounts} />
      <section className="rounded-3xl border border-border bg-paper p-6 shadow-soft">
        <p className="eyebrow text-champagne">Guest profile</p><h2 className="mt-1 text-2xl font-semibold text-walnut">Stay insights</h2>
        <div className="mt-5 rounded-2xl bg-ivory/70 p-4"><p className="text-sm text-stone">Average recorded stay</p><p className="mt-1 font-display text-4xl font-semibold text-coffee">{averageStay.toFixed(1)} <span className="text-lg">days</span></p></div>
        <div className="mt-5 space-y-3">{Object.entries(nationalities).map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-border pb-2 text-sm"><span className="text-charcoal">{label}</span><span className="font-semibold text-walnut">{value}</span></div>)}</div>
        <p className="mt-4 text-xs text-stone">Customer details are aggregated for operational planning; phone numbers and ID numbers are not displayed.</p>
      </section>
    </div>
    <section className="mt-6 rounded-3xl border border-border bg-paper p-6 shadow-soft"><p className="eyebrow text-champagne">Coverage</p><h2 className="mt-1 text-2xl font-semibold text-walnut">Portfolio snapshot</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data.properties.map((property) => <div key={property.record_id} className="rounded-2xl bg-ivory/70 p-4"><p className="font-semibold text-walnut">{property.name}</p><p className="text-sm text-stone">{property.location}</p><p className="mt-2 text-xs text-coffee">{open.filter((task) => task.property_id === property.property_id).length} open tasks · {data.users.filter((user) => user.property_id === property.property_id).length} staff</p></div>)}</div></section>
  </>
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => { counts[value] = (counts[value] || 0) + 1; return counts }, {})
}

function Chart({ title, subtitle, values }: { title: string; subtitle: string; values: Array<{ label: string; value: number }> }) {
  const max = Math.max(1, ...values.map((item) => item.value))
  return <section className="rounded-3xl border border-border bg-paper p-6 shadow-soft"><p className="eyebrow text-champagne">Live distribution</p><h2 className="mt-1 text-2xl font-semibold text-walnut">{title}</h2><p className="text-sm text-stone">{subtitle}</p><div className="mt-5 space-y-4">{values.map((item) => <div key={item.label}><div className="mb-1.5 flex items-center justify-between text-sm"><span className="text-charcoal">{item.label}</span><span className="font-semibold text-walnut">{item.value}</span></div><div className="h-2 overflow-hidden rounded-full bg-sand/40"><div className="h-full rounded-full bg-gradient-to-r from-coffee to-champagne" style={{ width: `${Math.max(item.value ? 8 : 0, item.value / max * 100)}%` }} /></div></div>)}</div></section>
}


