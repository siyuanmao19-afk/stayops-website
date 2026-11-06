import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCopy,
  FileText,
  Loader2,
  MessageSquareQuote,
  PenLine,
  Save,
  ScrollText,
  Sparkles,
  Tag,
  UserCog,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ApprovalTag, PageHeader, TypeBadge } from '@/components/app/PageHeader'
import { DataState } from '@/components/app/DataState'
import { RichText, stripBold } from '@/components/brand/RichText'
import { askAssistant, updateTask } from '@/lib/api'
import { useStayOpsData } from '@/lib/data-context'
import { EXAMPLE_QUESTIONS, type AssistantResult } from '@/lib/domain'

export const Route = createFileRoute('/app/assistant')({
  component: AssistantPage,
})

const MAX_QUESTION = 1200
type Phase = 'idle' | 'processing' | 'success' | 'error'

function AssistantPage() {
  const { data, loading, error, refresh } = useStayOpsData()
  const [propertyId, setPropertyId] = useState('')
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!propertyId) return setFieldError('Choose the property this enquiry belongs to.')
    if (q.length < 8) return setFieldError('Describe the guest request in a little more detail.')
    if (q.length > MAX_QUESTION) return setFieldError(`Keep the request under ${MAX_QUESTION} characters.`)
    setFieldError(null)
    setPhase('processing')
    setResult(null)
    setEditing(false)
    setReviewed(false)
    try {
      const r = await askAssistant(propertyId, q)
      setResult(r)
      setDraft(r.guest_reply)
      setPhase('success')
    } catch {
      setPhase('error')
    }
  }

  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || 'No data returned.'} retry={refresh} />

  return (
    <>
      <PageHeader
        eyebrow="AI Assistant"
        title="Ask StayOps AI"
        description="Paste a guest message. StayOps classifies it, matches the property’s own procedure and drafts a reply for you to review."
      />

      <form
        onSubmit={submit}
        noValidate
        className="rounded-3xl border border-border bg-paper p-5 shadow-soft sm:p-7"
      >
        <div className="grid gap-5 md:grid-cols-[260px_1fr]">
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="property" className="h-11 w-full rounded-xl bg-ivory/50">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {data.properties.map((p) => (
                  <SelectItem key={p.property_id} value={p.property_id}>
                    {p.name} · {p.city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="question">Guest request</Label>
              <span className="text-xs text-stone">
                {question.length}/{MAX_QUESTION}
              </span>
            </div>
            <Textarea
              id="question"
              value={question}
              maxLength={MAX_QUESTION}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Guest in Room 3 asks if they can check out at 15:00 tomorrow…"
              className="min-h-28 rounded-xl bg-ivory/50"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'form-error' : undefined}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label="Example questions">
          {EXAMPLE_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => {
                setQuestion(q)
                if (!propertyId && data.properties[0]) setPropertyId(data.properties[0].property_id)
              }}
              className="rounded-full border border-border bg-ivory/60 px-3 py-1.5 text-left text-xs text-stone transition-colors hover:border-champagne hover:text-walnut"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          {fieldError ? (
            <p id="form-error" role="alert" className="text-sm text-terracotta">
              {fieldError}
            </p>
          ) : (
            <p className="text-xs text-stone">
              A task is created for every request, so nothing gets lost.
            </p>
          )}
          <Button
            type="submit"
            disabled={phase === 'processing'}
            className="h-11 rounded-full px-6"
          >
            {phase === 'processing' ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles aria-hidden="true" />
            )}
            Ask StayOps AI
          </Button>
        </div>
      </form>

      <p className="mt-5 flex items-center gap-2 rounded-2xl border border-terracotta/20 bg-terracotta/[0.06] px-4 py-3 text-sm text-terracotta">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        AI output is a draft. Staff must review it before taking action or replying.
      </p>

      <section aria-live="polite" aria-busy={phase === 'processing'} className="mt-8">
        {phase === 'idle' && (
          <div className="rounded-3xl border border-dashed border-champagne/40 bg-paper/50 px-6 py-14 text-center">
            <MessageSquareQuote className="mx-auto size-8 text-champagne" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl font-semibold text-walnut">Ready when a guest is</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-stone">
              Choose a property and describe the request. The analysis appears here in six clear sections.
            </p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm text-coffee shadow-soft">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating the task, reading this property’s procedures and drafting a response…
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-paper/80 motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {phase === 'error' && (
          <div role="alert" className="rounded-3xl border border-terracotta/30 bg-paper p-6">
            <p className="font-semibold text-terracotta">The assistant couldn’t finish this request.</p>
            <p className="mt-1 text-sm text-stone">
              Your task was kept. Try again in a moment, or handle it manually from Tasks.
            </p>
          </div>
        )}

        {phase === 'success' && result && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone">
                Task <span className="font-mono text-walnut">{result.task_id}</span> created
              </p>
              {reviewed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> Reviewed
                </span>
              )}
            </div>

            <ResultCard n={1} icon={<Tag />} title="Task Type" extra={<TypeBadge type={result.task_type} />}>
              <RichText text={result.task_type_reason} />
            </ResultCard>

            <ResultCard n={2} icon={<FileText />} title="Core Request Summary">
              <RichText text={result.summary} />
            </ResultCard>

            <ResultCard n={3} icon={<BookOpenCheck />} title="Matched Procedure">
              {result.procedure ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-walnut px-2 py-0.5 font-mono text-xs text-sand">
                      {result.procedure.procedure_id}
                    </span>
                    <span className="font-semibold text-walnut">{result.procedure.title}</span>
                  </div>
                  <ol className="list-decimal space-y-1 pl-5">
                    {result.procedure.instructions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <ApprovalTag level={result.procedure.approval_level} rule={result.procedure.approval_rule} />
                </div>
              ) : (
                <p>
                  <strong className="font-semibold text-terracotta">No verified procedure match.</strong>{' '}
                  This property has no procedure for this kind of request, so none is cited. Follow the
                  escalation advice below.
                </p>
              )}
            </ResultCard>

            <ResultCard n={4} icon={<UserCog />} title="Recommended Staff Action">
              <RichText text={result.staff_action} />
            </ResultCard>

            <ResultCard
              n={5}
              icon={<MessageSquareQuote />}
              title="Guest Reply Draft"
              highlight
              extra={
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(stripBold(draft))
                        toast.success('Reply draft copied')
                      } catch {
                        toast.error('Couldn’t copy — select the text instead')
                      }
                    }}
                  >
                    <ClipboardCopy aria-hidden="true" /> Copy
                  </Button>
                  {editing ? (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={async () => {
                        if (!draft.trim()) return toast.error('The reply can’t be empty')
                        try {
                          await updateTask({ record_id: result.task_record_id, task_id: result.task_id, draft_response: draft.trim(), status: 'Draft Ready', action: 'Edited the AI guest reply draft' })
                          setEditing(false)
                          setReviewed(false)
                          await refresh()
                          toast.success('Changes saved and logged')
                        } catch (reason) {
                          toast.error(reason instanceof Error ? reason.message : 'Could not save the draft')
                        }
                      }}
                    >
                      <Save aria-hidden="true" /> Save changes
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => setEditing(true)}>
                      <PenLine aria-hidden="true" /> Edit draft
                    </Button>
                  )}
                </div>
              }
            >
              {editing ? (
                <>
                  <Label htmlFor="draft" className="sr-only">
                    Edit guest reply draft
                  </Label>
                  <Textarea
                    id="draft"
                    value={draft}
                    maxLength={2000}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-32 rounded-xl bg-ivory/50"
                  />
                </>
              ) : (
                <p className="whitespace-pre-line">
                  <RichText text={draft} />
                </p>
              )}
            </ResultCard>

            <ResultCard n={6} icon={<ScrollText />} title="Handling Record">
              <RichText text={result.handling_record} />
            </ResultCard>

            <div className="flex justify-end">
              <Button
                className="h-11 rounded-full px-6"
                disabled={reviewed || editing}
                onClick={async () => {
                  try {
                    await updateTask({ record_id: result.task_record_id, task_id: result.task_id, draft_response: draft.trim(), status: 'Draft Ready', action: 'Reviewed and approved the AI reply draft' })
                    setReviewed(true)
                    await refresh()
                    toast.success('Marked as reviewed and logged')
                  } catch (reason) {
                    toast.error(reason instanceof Error ? reason.message : 'Could not mark this task as reviewed')
                  }
                }}
              >
                <CheckCircle2 aria-hidden="true" />
                {reviewed ? 'Reviewed' : 'Mark as reviewed'}
              </Button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}

function ResultCard({
  n,
  icon,
  title,
  extra,
  highlight,
  children,
}: {
  n: number
  icon: React.ReactNode
  title: string
  extra?: React.ReactNode
  highlight?: boolean
  children: React.ReactNode
}) {
  return (
    <article
      className={`animate-rise-in rounded-3xl border bg-paper p-6 shadow-soft ${highlight ? 'border-champagne/50' : 'border-border'}`}
      style={{ animationDelay: `${(n - 1) * 70}ms` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 font-display text-2xl font-semibold text-walnut">
          <span className="grid size-9 place-items-center rounded-xl bg-sand/40 text-coffee [&_svg]:size-4">
            {icon}
          </span>
          <span className="text-sm font-sans font-semibold text-champagne">{n}</span>
          {title}
        </h2>
        {extra}
      </div>
      <div className="mt-4 leading-relaxed text-charcoal">{children}</div>
    </article>
  )
}

