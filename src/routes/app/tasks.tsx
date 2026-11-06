import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { ClipboardList, LayoutGrid, PenLine, Rows3, Search, User } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DataState } from '@/components/app/DataState'
import { EmptyState, PageHeader, StatusBadge, TypeBadge } from '@/components/app/PageHeader'
import { RichText } from '@/components/brand/RichText'
import { updateTask } from '@/lib/api'
import { useStayOpsData } from '@/lib/data-context'
import { TASK_STATUSES, TASK_TYPES, type Task, type TaskStatus } from '@/lib/domain'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/app/tasks')({
  component: TasksPage,
})

const ALL = 'all'

function TasksPage() {
  const { data, loading, error, refresh, propertyById } = useStayOpsData()
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [query, setQuery] = useState('')
  const [property, setProperty] = useState(ALL)
  const [type, setType] = useState(ALL)
  const [status, setStatus] = useState(ALL)
  const [editing, setEditing] = useState<Task | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (data?.tasks || []).filter(
      (t) =>
        (property === ALL || t.property_id === property) &&
        (type === ALL || t.task_type === type) &&
        (status === ALL || t.status === status) &&
        (!q || `${t.title} ${t.description} ${t.id} ${t.assigned_to}`.toLowerCase().includes(q)),
    )
  }, [data, query, property, type, status])

  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || 'No data returned.'} retry={refresh} />

  return (
    <>
      <PageHeader
        eyebrow="Tasks"
        title="Every request, in one place"
        description="Original AI analysis stays untouched. Staff can refine the reply draft and move the status forward."
        actions={
          <div className="inline-flex rounded-full border border-border bg-paper p-1" role="group" aria-label="Layout">
            <ViewButton active={view === 'cards'} onClick={() => setView('cards')} label="Cards">
              <LayoutGrid className="size-4" />
            </ViewButton>
            <ViewButton active={view === 'table'} onClick={() => setView('table')} label="Table">
              <Rows3 className="size-4" />
            </ViewButton>
          </div>
        }
      />

      <div className="mb-6 grid gap-3 rounded-3xl border border-border bg-paper p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="relative">
          <Label htmlFor="task-search" className="sr-only">Search tasks</Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" aria-hidden="true" />
          <Input
            id="task-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, guest note, staff…"
            className="h-10 rounded-xl bg-ivory/50 pl-9"
          />
        </div>
        <Filter label="Property" allLabel="All properties" value={property} onChange={setProperty}
          options={data.properties.map((p) => ({ value: p.property_id, label: p.name }))} />
        <Filter label="Task type" allLabel="All task types" value={type} onChange={setType}
          options={TASK_TYPES.map((t) => ({ value: t, label: t }))} />
        <Filter label="Status" allLabel="All statuses" value={status} onChange={setStatus}
          options={TASK_STATUSES.map((s) => ({ value: s, label: s }))} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="No tasks match"
          body="Try clearing a filter or searching for a different word."
        />
      ) : view === 'cards' ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filtered.map((t) => (
            <article key={t.id} className="flex flex-col rounded-3xl border border-border bg-paper p-6 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-stone">{t.id}</span>
                <TypeBadge type={t.task_type} />
                <StatusBadge status={t.status} />
                {t.urgent && (
                  <span className="rounded-full bg-terracotta px-2 py-0.5 text-xs font-medium text-paper">Urgent</span>
                )}
              </div>
              <h2 className="mt-3 text-2xl font-semibold leading-tight text-walnut">{t.title}</h2>
              <p className="mt-1 text-sm text-stone">{propertyById(t.property_id)?.name}</p>
              <p className="mt-3 text-sm text-charcoal">{t.description}</p>

              <dl className="mt-4 space-y-3 rounded-2xl bg-ivory/70 p-4 text-sm">
                <Field label="AI summary"><RichText text={t.ai_summary} /></Field>
                <Field label="Procedure">
                  {t.procedure_id ? <span className="font-mono text-xs text-walnut">{t.procedure_id}</span> : <span className="text-terracotta">No verified procedure match</span>}
                </Field>
                <Field label="AI recommendation"><RichText text={t.ai_recommendation} /></Field>
              </dl>

              <div className="mt-4 rounded-2xl border border-champagne/40 p-4 text-sm">
                <p className="eyebrow text-champagne">Reply draft</p>
                <p className="mt-1 text-charcoal">{t.draft_response}</p>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                <span className="inline-flex items-center gap-1.5 text-sm text-stone">
                  <User className="size-4" aria-hidden="true" /> {t.assigned_to}
                </span>
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(t)}>
                  <PenLine aria-hidden="true" /> Edit draft & status
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-border bg-paper shadow-soft">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead className="min-w-64">AI summary</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="min-w-56 whitespace-normal">
                    <p className="font-medium text-walnut">{t.title}</p>
                    <p className="text-xs text-stone">{t.id} · {propertyById(t.property_id)?.name}</p>
                  </TableCell>
                  <TableCell><TypeBadge type={t.task_type} /></TableCell>
                  <TableCell className="font-mono text-xs">{t.procedure_id || '—'}</TableCell>
                  <TableCell className="whitespace-normal text-sm"><RichText text={t.ai_summary} /></TableCell>
                  <TableCell className="text-sm">{t.assigned_to}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setEditing(t)} aria-label={`Edit ${t.title}`}>
                      <PenLine />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EditDialog
        task={editing}
        onClose={() => setEditing(null)}
        onSave={async (task, draft, next) => {
          try {
            await updateTask({ record_id: task.record_id, task_id: task.id, draft_response: draft, status: next })
            setEditing(null)
            await refresh()
            toast.success('Draft, status and Activity Log updated')
          } catch (reason) {
            toast.error(reason instanceof Error ? reason.message : 'Could not update this task')
          }
        }}
      />
    </>
  )
}

function EditDialog({
  task,
  onClose,
  onSave,
}: {
  task: Task | null
  onClose: () => void
  onSave: (task: Task, draft: string, status: TaskStatus) => void | Promise<void>
}) {
  const [draft, setDraft] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Open')
  const [lastId, setLastId] = useState<string | null>(null)
  if (task && task.id !== lastId) {
    setLastId(task.id)
    setDraft(task.draft_response)
    setStatus(task.status)
  }
  const tooLong = draft.length > 2000

  return (
    <Dialog open={!!task} onOpenChange={(o) => { if (!o) { setLastId(null); onClose() } }}>
      <DialogContent className="bg-paper sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-walnut">{task?.title}</DialogTitle>
          <DialogDescription>
            Only the reply draft and status can change. The original AI analysis is preserved for the audit trail.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-draft">Reply draft</Label>
            <Textarea id="edit-draft" value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-36 rounded-xl" aria-invalid={tooLong || !draft.trim()} />
            {tooLong && <p className="text-xs text-terracotta">Keep the draft under 2000 characters.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger id="edit-status" className="w-full rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => { setLastId(null); onClose() }}>Cancel</Button>
          <Button className="rounded-full" disabled={tooLong || !draft.trim()} onClick={() => { if (task) { setLastId(null); void onSave(task, draft.trim(), status) } }}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Filter({ label, allLabel, value, onChange, options }: { label: string; allLabel: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="h-10 w-full rounded-xl bg-ivory/50">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-stone">{label}</dt>
      <dd className="mt-0.5 text-charcoal">{children}</dd>
    </div>
  )
}

function ViewButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors', active ? 'bg-walnut text-paper' : 'text-stone hover:text-walnut')}
    >
      {children} {label}
    </button>
  )
}

