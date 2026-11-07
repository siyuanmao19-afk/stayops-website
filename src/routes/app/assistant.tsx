import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
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
import { ApprovalTag, PageHeader } from '@/components/app/PageHeader'
import { DataState } from '@/components/app/DataState'
import { RichText, stripBold } from '@/components/brand/RichText'
import { askAssistant, updateTask } from '@/lib/api'
import { useStayOpsData } from '@/lib/data-context'
import { EXAMPLE_QUESTIONS, EXAMPLE_QUESTIONS_ZH, type AssistantResult, type AssistantText } from '@/lib/domain'
import { translateProcedure } from '@/lib/translation'
import { useLanguage } from '@/lib/language'

export const Route = createFileRoute('/app/assistant')({
  component: AssistantPage,
})

const MAX_QUESTION = 1200
type Phase = 'idle' | 'processing' | 'success' | 'error'

function AssistantPage() {
  const { language, pick } = useLanguage()
  const { data, loading, error, refresh, tx, ensureTranslated } = useStayOpsData()
  const [propertyId, setPropertyId] = useState('')
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  /** Staff-edited reply that was saved (null = the AI draft is unchanged). */
  const [savedDraft, setSavedDraft] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  // Chinese mode: make sure the matched procedure (and an English-only result) has Chinese text.
  useEffect(() => {
    if (language !== 'zh' || !result) return
    const p = result.procedure
    void ensureTranslated([
      ...(result.zh ? [] : [result.task_type_phrase, result.summary, result.staff_action, result.guest_reply]),
      ...(p ? [p.title, p.approval_rule, ...p.instructions] : []),
    ])
  }, [language, result, ensureTranslated])

  const view: AssistantText | null = result
    ? language === 'zh'
      ? result.zh ?? {
          title: tx(result.title),
          task_type_phrase: tx(result.task_type_phrase),
          summary: tx(result.summary),
          staff_action: tx(result.staff_action),
          guest_reply: tx(result.guest_reply),
        }
      : result
    : null
  const procedure = result?.procedure ? (language === 'zh' ? translateProcedure(result.procedure, tx) : result.procedure) : null
  const shownReply = savedDraft ?? view?.guest_reply ?? ''

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!propertyId) return setFieldError(pick('Choose the property this enquiry belongs to.', '请选择该咨询所属的房源。'))
    if (q.length < 8) return setFieldError(pick('Describe the guest request in a little more detail.', '请更详细地描述客人的需求。'))
    if (q.length > MAX_QUESTION) return setFieldError(pick(`Keep the request under ${MAX_QUESTION} characters.`, `请求内容请控制在 ${MAX_QUESTION} 字以内。`))
    setFieldError(null)
    setPhase('processing')
    setResult(null)
    setEditing(false)
    setReviewed(false)
    try {
      const r = await askAssistant(propertyId, q, language)
      setResult(r)
      setSavedDraft(null)
      setPhase('success')
    } catch {
      setPhase('error')
    }
  }

  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />

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
            <Label htmlFor="property">{pick('Property', '房源')}</Label>
            <Select value={propertyId} onValueChange={setPropertyId}>
              <SelectTrigger id="property" className="h-11 w-full rounded-xl bg-ivory/50">
                <SelectValue placeholder={pick('Select a property', '请选择房源')} />
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
              <Label htmlFor="question">{pick('Guest request', '客人问题或需求')}</Label>
              <span className="text-xs text-stone">
                {question.length}/{MAX_QUESTION}
              </span>
            </div>
            <Textarea
              id="question"
              value={question}
              maxLength={MAX_QUESTION}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={pick('e.g. Guest in Room 3 asks if they can check out at 15:00 tomorrow…', '例如：3 号房客人询问明天是否可以延迟到 15:00 退房……')}
              className="min-h-28 rounded-xl bg-ivory/50"
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'form-error' : undefined}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" aria-label={pick('Example questions', '示例问题')}>
          {(language === 'zh' ? EXAMPLE_QUESTIONS_ZH : EXAMPLE_QUESTIONS).map((q) => (
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
              {pick('A task is created for every request, so nothing gets lost.', '每次提交都会创建任务，确保问题不会遗漏。')}
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
            {pick('Ask StayOps AI', '询问 StayOps AI')}
          </Button>
        </div>
      </form>

      <p className="mt-5 flex items-center gap-2 rounded-2xl border border-terracotta/20 bg-terracotta/[0.06] px-4 py-3 text-sm text-terracotta">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {pick('AI output is a draft. Staff must review it before taking action or replying.', 'AI 输出仅为草稿，员工必须审核后才能采取行动或回复客人。')}
      </p>

      <section aria-live="polite" aria-busy={phase === 'processing'} className="mt-8">
        {phase === 'idle' && (
          <div className="rounded-3xl border border-dashed border-champagne/40 bg-paper/50 px-6 py-14 text-center">
            <MessageSquareQuote className="mx-auto size-8 text-champagne" aria-hidden="true" />
            <p className="mt-4 font-display text-2xl font-semibold text-walnut">{pick('Ready when a guest is', '随时准备处理客人问题')}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-stone">
              {pick('Choose a property and describe the request. The analysis appears here in six clear sections.', '选择房源并描述客人需求，AI 分析将以六个清晰部分显示在这里。')}
            </p>
          </div>
        )}

        {phase === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-paper p-4 text-sm text-coffee shadow-soft">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {pick('Creating the task, reading this property’s procedures and drafting a response…', '正在创建任务、读取该房源的操作规范并生成回复草稿……')}
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-3xl bg-paper/80 motion-reduce:animate-none" />
            ))}
          </div>
        )}

        {phase === 'error' && (
          <div role="alert" className="rounded-3xl border border-terracotta/30 bg-paper p-6">
            <p className="font-semibold text-terracotta">{pick('The assistant couldn’t finish this request.', 'AI 助手未能完成这次请求。')}</p>
            <p className="mt-1 text-sm text-stone">
              {pick('Your task was kept. Try again in a moment, or handle it manually from Tasks.', '任务已经保留，请稍后重试，或前往任务页面手动处理。')}
            </p>
          </div>
        )}

        {phase === 'success' && result && view && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone">
                {pick('Task', '任务')} <span className="font-mono text-walnut">{result.task_id}</span> {pick('created', '已创建')}
              </p>
              {reviewed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> {pick('Reviewed', '已审核')}
                </span>
              )}
            </div>

            <ResultCard
              n={1}
              icon={<Tag />}
              title={pick('Task Type', '任务类型')}
              extra={<span className="rounded-full border border-champagne/50 bg-sand/30 px-3 py-1 text-xs font-medium text-coffee">{view.task_type_phrase}</span>}
            >
              <p className="whitespace-pre-line">{question}</p>
            </ResultCard>

            <ResultCard n={2} icon={<FileText />} title={pick('Core Request Summary', '核心需求摘要')}>
              <RichText text={view.summary} />
            </ResultCard>

            <ResultCard n={3} icon={<BookOpenCheck />} title={pick('Matched Procedure', '匹配的操作规范')}>
              {procedure ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-walnut px-2 py-0.5 font-mono text-xs text-sand">
                      {procedure.procedure_id}
                    </span>
                    <span className="font-semibold text-walnut">{procedure.title}</span>
                  </div>
                  <ol className="list-decimal space-y-1 pl-5">
                    {procedure.instructions.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <ApprovalTag level={procedure.approval_level} rule={procedure.approval_rule} />
                </div>
              ) : (
                <p>
                  <strong className="font-semibold text-terracotta">{pick('No verified procedure match.', '未匹配到已验证的操作规范。')}</strong>{' '}
                  {pick(
                    'This property has no procedure for this kind of request, so none is cited. Follow the escalation advice below.',
                    '该房源没有针对此类请求的操作规范，因此不引用任何规范。请按照下方的升级建议处理。',
                  )}
                </p>
              )}
            </ResultCard>

            <ResultCard n={4} icon={<UserCog />} title={pick('Recommended Staff Action', '建议员工操作')}>
              <RichText text={view.staff_action} />
            </ResultCard>

            <ResultCard
              n={5}
              icon={<MessageSquareQuote />}
              title={pick('Guest Reply Draft', '客人回复草稿')}
              highlight
              extra={
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(stripBold(editing ? draft : shownReply))
                        toast.success(pick('Reply draft copied', '回复草稿已复制'))
                      } catch {
                        toast.error(pick('Couldn’t copy — select the text instead', '复制失败，请手动选择文本'))
                      }
                    }}
                  >
                    <ClipboardCopy aria-hidden="true" /> {pick('Copy', '复制')}
                  </Button>
                  {editing ? (
                    <Button
                      size="sm"
                      className="rounded-full"
                      onClick={async () => {
                        if (!draft.trim()) return toast.error(pick('The reply can’t be empty', '回复内容不能为空'))
                        try {
                          const edited = draft.trim()
                          // Unchanged text is sent as the stored English; edited Chinese is translated server-side.
                          const english = edited === (view.guest_reply || '').trim() && savedDraft === null ? result.guest_reply : edited
                          await updateTask({ record_id: result.task_record_id, task_id: result.task_id, draft_response: english, status: 'Draft Ready', action: 'Edited the AI guest reply draft' })
                          setSavedDraft(edited)
                          setEditing(false)
                          setReviewed(false)
                          await refresh()
                          toast.success(pick('Changes saved and logged', '修改已保存并记录'))
                        } catch (reason) {
                          toast.error(reason instanceof Error ? reason.message : pick('Could not save the draft', '无法保存草稿'))
                        }
                      }}
                    >
                      <Save aria-hidden="true" /> {pick('Save changes', '保存修改')}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setDraft(shownReply); setEditing(true) }}>
                      <PenLine aria-hidden="true" /> {pick('Edit draft', '编辑草稿')}
                    </Button>
                  )}
                </div>
              }
            >
              {editing ? (
                <>
                  <Label htmlFor="draft" className="sr-only">
                    {pick('Edit guest reply draft', '编辑客人回复草稿')}
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
                  <RichText text={shownReply} />
                </p>
              )}
            </ResultCard>

            <ResultCard n={6} icon={<ScrollText />} title={pick('Handling Record', '处理记录')}>
              <RichText text={pick(
                result.handling_record,
                '本次分析已保存到 **活动日志** 并关联到对应任务。员工修改和最终状态会作为独立记录保存，从而形成完整的 **审计轨迹**。',
              )} />
            </ResultCard>

            <div className="flex justify-end">
              <Button
                className="h-11 rounded-full px-6"
                disabled={reviewed || editing}
                onClick={async () => {
                  try {
                    await updateTask({ record_id: result.task_record_id, task_id: result.task_id, draft_response: savedDraft ?? result.guest_reply, status: 'Draft Ready', action: 'Reviewed and approved the AI reply draft' })
                    setReviewed(true)
                    await refresh()
                    toast.success(pick('Marked as reviewed and logged', '已标记为已审核并记录'))
                  } catch (reason) {
                    toast.error(reason instanceof Error ? reason.message : pick('Could not mark this task as reviewed', '无法将该任务标记为已审核'))
                  }
                }}
              >
                <CheckCircle2 aria-hidden="true" />
                {reviewed ? pick('Reviewed', '已审核') : pick('Mark as reviewed', '标记为已审核')}
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


