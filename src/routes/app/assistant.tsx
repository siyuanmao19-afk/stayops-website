import { createFileRoute, Link } from '@tanstack/react-router'
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
import { ApiError, askAssistant, assignTask, updateTask } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useStayOpsData } from '@/lib/data-context'
import { EXAMPLE_QUESTIONS, EXAMPLE_QUESTIONS_ZH, type AssistantResult, type AssistantText, type Task, type User } from '@/lib/domain'
import { translateProcedure } from '@/lib/translation'
import { useLanguage } from '@/lib/language'

export const Route = createFileRoute('/app/assistant')({
  component: AssistantPage,
})

const MAX_QUESTION = 1200
type Phase = 'idle' | 'processing' | 'success' | 'error'

function AssistantPage() {
  const { language, pick, tv } = useLanguage()
  const { user } = useAuth()
  const manager = user?.email?.toLowerCase() === 'siyuanmao19@gmail.com'
  const { data, loading, error, refresh, tx, ensureTranslated } = useStayOpsData()
  const [assignmentTaskId, setAssignmentTaskId] = useState('')
  const [assigneeEmail, setAssigneeEmail] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [propertyId, setPropertyId] = useState('')
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [assistantError, setAssistantError] = useState<string | null>(null)
  const [savedTaskId, setSavedTaskId] = useState<string | null>(null)
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
      result.priority_reason,
      result.assignment_reason,
      ...(p ? [p.title, p.approval_rule, ...p.instructions] : []),
    ].filter(Boolean))
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
    setAssistantError(null)
    setSavedTaskId(null)
    setPhase('processing')
    setResult(null)
    setEditing(false)
    setReviewed(false)
    try {
      const r = await askAssistant(propertyId, q, language)
      setResult(r)
      if (manager) {
        setAssignmentTaskId(r.task_record_id)
        setAssigneeEmail(r.recommended_staff_email)
      }
      setSavedDraft(null)
      await refresh()
      setPhase('success')
    } catch (reason) {
      const savedId = reason instanceof ApiError ? reason.taskRecordId : null
      setSavedTaskId(savedId)
      setAssistantError(reason instanceof ApiError && reason.status === 502
        ? pick('The AI service returned an incomplete response. The saved task is ready for manual review.', 'AI 服务返回的分析不完整。已保存的任务可以手动处理。')
        : pick('The AI analysis failed. Check the task list before submitting the same request again.', 'AI 分析失败。重新提交同一请求前，请先检查任务列表。'))
      if (manager && savedId) setAssignmentTaskId(savedId)
      setPhase('error')
      void refresh()
    }
  }

  if (loading && !data) return <DataState loading />
  if (error || !data) return <DataState error={error || pick('No data returned.', '未返回数据。')} retry={refresh} />

  const unassigned = manager ? data.tasks.filter((item) => !item.assigned_to || item.assigned_to === 'Unassigned') : []
  const selectedTask = unassigned.find((item) => item.record_id === assignmentTaskId)
  const availableEmployees = selectedTask
    ? data.users.filter((item) => item.email && item.email.toLowerCase() !== user?.email?.toLowerCase() && (!item.property_id || item.property_id === selectedTask.property_id))
    : []
  const selectedEmployee = availableEmployees.some((item) => item.email.toLowerCase() === assigneeEmail) ? assigneeEmail : ''
  const suggestedEmail = selectedTask?.record_id === result?.task_record_id
    ? result?.recommended_staff_email || ''
    : selectedTask?.recommended_staff_email || ''

  return (
    <>
      <PageHeader
        eyebrow="AI Assistant"
        title="Ask StayOps AI"
        description="Paste a guest message. StayOps classifies it, matches the property’s own procedure and drafts a reply for you to review."
      />

      {manager && (
        <section className="mb-6 rounded-3xl border border-champagne/40 bg-paper p-5 shadow-soft sm:p-7">
          <h2 className="font-display text-2xl font-semibold text-walnut">{pick('AI task assignment', 'AI 任务分配')}</h2>
          <p className="mt-1 text-sm text-stone">{pick(`Review one of ${unassigned.length} unassigned tasks, then choose an employee.`, `当前有 ${unassigned.length} 项未分配任务，请选择任务和员工。`)}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select
              aria-label={pick('Unassigned task', '未分配任务')}
              value={selectedTask ? assignmentTaskId : ''}
              onChange={(event) => { setAssignmentTaskId(event.target.value); setAssigneeEmail('') }}
              disabled={unassigned.length === 0}
              className="h-11 w-full min-w-0 rounded-xl border border-input bg-paper px-3 text-sm text-walnut shadow-xs disabled:opacity-50"
            >
              <option value="">{pick('Choose unassigned task', '选择未分配任务')}</option>
              {unassigned.map((item) => <option key={item.record_id} value={item.record_id}>{item.title} · {item.id}</option>)}
            </select>
            <select
              aria-label={pick('Employee', '员工')}
              value={selectedEmployee}
              onChange={(event) => setAssigneeEmail(event.target.value)}
              disabled={!selectedTask || availableEmployees.length === 0}
              className="h-11 w-full min-w-0 rounded-xl border border-input bg-paper px-3 text-sm text-walnut shadow-xs disabled:opacity-50"
            >
              <option value="">{pick('Choose employee', '选择员工')}</option>
              {availableEmployees.map((item) => <option key={item.email} value={item.email.toLowerCase()}>{item.name || item.email} · {item.email}</option>)}
            </select>
          </div>
          {assignmentTaskId && !selectedTask && <p className="mt-2 text-sm text-stone">{pick('That task is no longer awaiting assignment. Choose another task.', '当前任务已不在待分配列表中，请重新选择。')}</p>}
          {selectedTask && <p className="mt-3 text-sm text-stone">{pick('AI priority', 'AI 优先级')}: {tv(selectedTask.priority)} · {selectedTask.priority_reason} · {pick('Recommended employee', '推荐员工')}: {suggestedEmail || pick('No suitable employee suggested', '暂无合适员工建议')}</p>}
          {selectedTask?.assignment_reason && <p className="mt-1 text-sm text-stone">{selectedTask.assignment_reason}</p>}
          <Button className="mt-4 rounded-full" disabled={!selectedTask || !selectedEmployee || assigning} onClick={async () => {
            if (!selectedTask || !selectedEmployee) return
            setAssigning(true)
            try {
              await assignTask(selectedTask.record_id, selectedEmployee)
              await refresh()
              setAssignmentTaskId('')
              setAssigneeEmail('')
              toast.success(pick('Task assigned; employee notified in the workspace', '任务已分配，员工站内消息已更新'))
            } catch (reason) {
              toast.error(reason instanceof Error ? reason.message : pick('Could not assign task', '分配失败'))
            } finally { setAssigning(false) }
          }}>{pick('Assign task', '确认分配')}</Button>
        </section>
      )}

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
            <p className="mt-1 text-sm text-stone">{assistantError}</p>
            {savedTaskId && <p className="mt-2 text-xs text-stone">{pick('Saved task', '已保存任务')}: <span className="font-mono">{savedTaskId}</span></p>}
          </div>
        )}

        {phase === 'success' && result && view && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-stone">
                {pick('Task', '任务')} <span className="font-mono text-walnut">{result.task_id}</span> {pick('created', '已创建')}
              </p>
              <Link to="/app/tasks" search={{ task: result.task_record_id }} className="text-sm font-medium text-coffee underline underline-offset-4 hover:text-walnut">
                {pick('View this task in Tasks', '在任务中查看此任务')}
              </Link>
              {reviewed && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sage/15 px-3 py-1 text-xs font-medium text-sage">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> {pick('Reviewed', '已审核')}
                </span>
              )}
            </div>

            {manager && (
              <ResultAssignment
                key={result.task_record_id}
                result={result}
                task={data.tasks.find((item) => item.record_id === result.task_record_id)}
                users={data.users}
                refresh={refresh}
                onAssigned={() => { setAssignmentTaskId(''); setAssigneeEmail('') }}
              />
            )}

            <ResultCard n={1} icon={<Tag />} title={pick('Task Type', '任务类型')}>
              <p>{view.task_type_phrase}</p>
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

function ResultAssignment({ result, task, users, refresh, onAssigned }: {
  result: AssistantResult
  task: Task | undefined
  users: User[]
  refresh: () => Promise<void>
  onAssigned: () => void
}) {
  const { pick, tv } = useLanguage()
  const { tx } = useStayOpsData()
  const [email, setEmail] = useState(result.recommended_staff_email)
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState('')
  const eligible = task ? users.filter((item) => item.email && (!item.property_id || item.property_id === task.property_id)) : []
  const chosen = eligible.find((item) => item.email.toLowerCase() === email.toLowerCase())
  const recommended = eligible.find((item) => item.email.toLowerCase() === result.recommended_staff_email.toLowerCase())
  const alreadyAssigned = Boolean(task && task.assigned_to !== 'Unassigned')

  return (
    <section className="rounded-3xl border border-champagne/50 bg-paper p-5 shadow-soft sm:p-6" aria-label={pick('Assign this task', '分配此任务')}>
      <h2 className="font-display text-2xl font-semibold text-walnut">{pick('Recommended employee', '推荐员工')}</h2>
      <p className="mt-2 text-sm text-stone">{pick('Priority', '优先级')}: {tv(result.priority)}{result.priority_reason && ` · ${tx(result.priority_reason)}`}</p>
      <p className="mt-2 text-coffee">
        {recommended ? `${recommended.name || recommended.email} · ${recommended.email}` : pick('No eligible registered employee is available yet.', '目前没有可分配的已注册员工。')}
      </p>
      {result.assignment_reason && <p className="mt-1 text-sm text-stone">{tx(result.assignment_reason)}</p>}
      {alreadyAssigned || sentTo ? (
        <p className="mt-4 text-sm font-medium text-sage" role="status">{pick('Task assigned', '任务已分配')}{sentTo ? ` · ${sentTo}` : ''}</p>
      ) : (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            aria-label={pick('Choose employee for this task', '选择此任务的员工')}
            value={chosen?.email.toLowerCase() || ''}
            onChange={(event) => setEmail(event.target.value)}
            disabled={!task || eligible.length === 0 || sending}
            className="h-11 min-w-0 flex-1 rounded-xl border border-input bg-paper px-3 text-sm text-walnut shadow-xs disabled:opacity-50"
          >
            <option value="">{pick('Choose an employee', '选择员工')}</option>
            {eligible.map((item) => <option key={item.record_id} value={item.email.toLowerCase()}>{item.name || item.email} · {item.email}</option>)}
          </select>
          <Button
            className="h-11 rounded-full"
            disabled={!task || !chosen || sending}
            onClick={async () => {
              if (!task || !chosen) return
              setSending(true)
              try {
                await assignTask(task.record_id, chosen.email)
                setSentTo(chosen.email)
                await refresh()
                onAssigned()
                toast.success(pick('Task sent; employee notified in the workspace', '任务已发送，员工站内消息已更新'))
              } catch (reason) {
                toast.error(reason instanceof Error ? reason.message : pick('Could not assign task', '分配失败'))
              } finally { setSending(false) }
            }}
          >
            {sending ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            {chosen?.email.toLowerCase() === result.recommended_staff_email.toLowerCase()
              ? pick('Send to recommended employee', '发送给推荐员工')
              : pick('Send to selected employee', '发送给所选员工')}
          </Button>
        </div>
      )}
    </section>
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


