import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { ScrollText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApprovalTag, EmptyState, PageHeader, TypeBadge } from '@/components/app/PageHeader'
import { DEMO_PROCEDURES, DEMO_PROPERTIES, TASK_TYPES, propertyById } from '@/lib/fixtures'

export const Route = createFileRoute('/app/procedures')({
  component: ProceduresPage,
})

function ProceduresPage() {
  const [q, setQ] = useState('')
  const [property, setProperty] = useState('all')
  const [type, setType] = useState('all')
  const s = q.trim().toLowerCase()
  const list = DEMO_PROCEDURES.filter(
    (p) =>
      (property === 'all' || p.property_id === property) &&
      (type === 'all' || p.task_type === type) &&
      (!s || `${p.procedure_id} ${p.title} ${p.instructions.join(' ')}`.toLowerCase().includes(s)),
  )

  return (
    <>
      <PageHeader
        eyebrow="Procedures"
        title="House rules, written down"
        description="The only procedures the AI is allowed to cite. Each carries its own approval rule."
      />
      <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-paper p-4 shadow-soft sm:grid-cols-[1.5fr_1fr_1fr]">
        <div className="relative">
          <Label htmlFor="proc-search" className="sr-only">Search procedures</Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden="true" />
          <Input id="proc-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, title or step…" className="h-10 rounded-xl bg-ivory/50 pl-9" />
        </div>
        <Select value={property} onValueChange={setProperty}>
          <SelectTrigger aria-label="Property" className="h-10 w-full rounded-xl bg-ivory/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All properties</SelectItem>
            {DEMO_PROPERTIES.map((p) => <SelectItem key={p.property_id} value={p.property_id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger aria-label="Task type" className="h-10 w-full rounded-xl bg-ivory/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All task types</SelectItem>
            {TASK_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<ScrollText className="size-5" />} title="No procedures found" body="This property may not have a written procedure for that type yet." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {list.map((p) => (
            <article key={p.procedure_id} className="flex flex-col rounded-3xl border border-border bg-paper p-6 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-walnut px-2 py-0.5 font-mono text-xs text-sand">{p.procedure_id}</span>
                <TypeBadge type={p.task_type} />
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-walnut">{p.title}</h2>
              <p className="text-sm text-stone">{propertyById(p.property_id)?.name} · {p.property_id}</p>
              <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-sm text-charcoal">
                {p.instructions.map((i) => <li key={i}>{i}</li>)}
              </ol>
              <div className="mt-auto pt-5">
                <ApprovalTag level={p.approval_level} rule={p.approval_rule} />
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  )
}
