import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpenCheck,
  ClipboardList,
  KeyRound,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Workflow,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteFooter, SiteNav } from '@/components/brand/SiteNav'
import { HeroCarousel } from '@/components/home/HeroCarousel'
import { LocationGraph } from '@/components/home/LocationGraph'
import { RichText } from '@/components/brand/RichText'
import { DemoBadge } from '@/components/brand/DemoBadge'
import { useLanguage } from '@/lib/language'

export const Route = createFileRoute('/')({
  component: Home,
})

const PAINS = [
  {
    title: 'Messages arrive everywhere',
    body: 'Guest questions land in chat apps, booking platforms and phone calls — and the urgent ones are easy to miss at night.',
  },
  {
    title: 'Procedures live in people’s heads',
    body: 'Each property has its own rules for late check-out, repairs and refunds. New staff guess; experienced staff get interrupted.',
  },
  {
    title: 'No one can see what happened',
    body: 'When a guest follows up, it’s hard to tell who replied, what was promised and whether a manager approved it.',
  },
]

const CAPABILITIES = [
  {
    icon: MessageSquareText,
    title: 'Guest Intelligence',
    body: 'Gathers guest questions and feedback in one place and quickly surfaces what needs attention first.',
  },
  {
    icon: BookOpenCheck,
    title: 'Procedure-aware AI',
    body: 'Matches each request to the property’s own operating procedures and approval rules — never invented ones.',
  },
  {
    icon: Workflow,
    title: 'Operational Clarity',
    body: 'Keeps the task, the reply draft and every handling step in a single, traceable workflow.',
  },
]

const FLOW = [
  { step: '01', title: 'Enquiry captured', body: 'Staff choose the property and paste the guest’s message.' },
  { step: '02', title: 'Task created', body: 'StayOps opens a task so nothing is lost, even before AI runs.' },
  { step: '03', title: 'Procedure matched', body: 'The AI may only cite procedures that exist for that property.' },
  { step: '04', title: 'Draft for review', body: 'A recommended action and a polite reply draft, clearly marked as draft.' },
  { step: '05', title: 'Logged & approved', body: 'Edits, approvals and the final action are written to Activity Logs.' },
]

const PAINS_ZH = [
  { title: '消息从各个平台涌入', body: '客人问题来自聊天软件、预订平台和电话，夜间最紧急的信息尤其容易被遗漏。' },
  { title: '操作流程只存在于员工经验里', body: '不同房源有各自的退房、维修和退款规则。新员工只能猜测，老员工则不断被打断。' },
  { title: '处理过程难以追踪', body: '客人再次询问时，很难快速确认谁回复过、承诺了什么，以及负责人是否批准。' },
]

const CAPABILITIES_ZH = [
  { icon: MessageSquareText, title: '客情洞察', body: '集中整理客人问题与反馈，快速识别最需要优先处理的事项。' },
  { icon: BookOpenCheck, title: '基于规范的 AI', body: '按照房源自己的操作流程和审批规则匹配建议，不编造不存在的规范。' },
  { icon: Workflow, title: '清晰的运营流程', body: '把任务、回复草稿和每一步处理记录集中在同一个可追踪流程中。' },
]

const FLOW_ZH = [
  { step: '01', title: '录入客人问题', body: '员工选择房源，并粘贴客人的原始消息。' },
  { step: '02', title: '自动创建任务', body: 'StayOps 先保存任务，即使 AI 暂时不可用，问题也不会丢失。' },
  { step: '03', title: '匹配操作规范', body: 'AI 只能引用该房源真实存在的操作流程。' },
  { step: '04', title: '生成审核草稿', body: '提供处理建议和礼貌回复，并明确标记为待审核草稿。' },
  { step: '05', title: '记录与审批', body: '员工修改、审批和最终操作都会写入活动日志。' },
]

function Home() {
  const { language, pick } = useLanguage()
  const pains = language === 'zh' ? PAINS_ZH : PAINS
  const capabilities = language === 'zh' ? CAPABILITIES_ZH : CAPABILITIES
  const flow = language === 'zh' ? FLOW_ZH : FLOW
  return (
    <div className="min-h-screen bg-ivory">
      <SiteNav />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-sand/40 blur-3xl" />
          <div className="relative mx-auto grid max-w-content items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
            <div className="animate-rise-in">
              <p className="eyebrow inline-flex items-center gap-2 rounded-full border border-champagne/40 bg-paper/70 px-3 py-1.5 text-coffee">
                <Sparkles className="size-3.5 text-champagne" aria-hidden="true" />
                {pick('AI-assisted homestay operations', 'AI 驱动的民宿运营')}
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] text-walnut sm:text-6xl lg:text-7xl">
                {pick('Run every stay with calm, clarity and care.', '让每一次入住，都从容、清晰而有温度。')}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
                {pick(
                  'StayOps brings guest enquiries, operating procedures and staff actions into one warm, intelligent workspace.',
                  'StayOps 将客人咨询、操作规范和员工行动集中在一个温馨、智能的工作台中。',
                )}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-[0.95rem]">
                  <Link to="/app/assistant">
                    {pick('Try the AI Assistant', '体验 AI 助手')} <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-walnut/20 bg-paper/60 px-7 text-[0.95rem] text-walnut"
                >
                  <a href="#workflow">{pick('Explore the workflow', '了解处理流程')}</a>
                </Button>
              </div>
              <p className="mt-8 font-display text-lg italic text-coffee">{pick('Manage Your Homestay Smarter', '让民宿运营更聪明')}</p>
            </div>
            <HeroCarousel />
          </div>
        </section>

        {/* Pain points */}
        <section aria-labelledby="pains" className="border-y border-border/70 bg-paper">
          <div className="mx-auto max-w-content px-4 py-20 sm:px-6">
            <p className="eyebrow text-champagne">{pick('The daily reality', '日常运营现实')}</p>
            <h2 id="pains" className="mt-3 max-w-2xl text-4xl font-semibold text-walnut sm:text-5xl">
              {pick('Small houses, many moving parts.', '房子不大，运营环节却很多。')}
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
              {pains.map((p, i) => (
                <div key={p.title} className="bg-paper p-8">
                  <span className="font-display text-3xl text-champagne">0{i + 1}</span>
                  <h3 className="mt-4 text-2xl font-semibold text-walnut">{p.title}</h3>
                  <p className="mt-3 leading-relaxed text-stone">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section aria-labelledby="capabilities" className="mx-auto max-w-content px-4 py-24 sm:px-6">
          <div className="max-w-2xl">
            <p className="eyebrow text-champagne">{pick('What StayOps does', 'StayOps 能做什么')}</p>
            <h2 id="capabilities" className="mt-3 text-4xl font-semibold text-walnut sm:text-5xl">
              {pick('Three quiet capabilities, working together.', '三种核心能力，协同完成运营工作。')}
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="group rounded-3xl border border-border bg-paper p-8 shadow-soft transition-shadow hover:shadow-lift"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-walnut text-sand">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-2xl font-semibold text-walnut">{title}</h3>
                <p className="mt-3 leading-relaxed text-stone">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Location network */}
        <section aria-labelledby="network" className="bg-walnut/[0.03] py-24">
          <div className="mx-auto max-w-content px-4 sm:px-6">
            <div className="mb-10 max-w-2xl">
              <p className="eyebrow text-champagne">{pick('Properties', '房源网络')}</p>
              <h2 id="network" className="mt-3 text-4xl font-semibold text-walnut sm:text-5xl">
                {pick('Every stay, connected.', '连接每一处房源与每一次入住。')}
              </h2>
              <p className="mt-4 text-lg text-stone">
                {pick(
                  'See your homestay network by province and city — which houses are operating, and where tasks are waiting.',
                  '按省份和城市查看民宿网络，了解哪些房源正在运营，以及哪里还有待处理任务。',
                )}
              </p>
            </div>
            <LocationGraph />
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" aria-labelledby="workflow-title" className="scroll-mt-20 mx-auto max-w-content px-4 py-24 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow text-champagne">{pick('AI workflow', 'AI 处理流程')}</p>
              <h2 id="workflow-title" className="mt-3 text-4xl font-semibold text-walnut sm:text-5xl">
                {pick('From a guest message to a reviewed answer.', '从客人消息，到员工审核后的回复。')}
              </h2>
              <p className="mt-4 text-lg text-stone">
                {pick(
                  'Every request follows the same path, so every shift works the same way — and every step leaves a record.',
                  '每个请求都按照相同流程处理，让不同班次保持一致，并为每一步留下记录。',
                )}
              </p>
              <ol className="mt-10 space-y-5">
                {flow.map((f) => (
                  <li key={f.step} className="flex gap-4">
                    <span className="mt-0.5 font-display text-xl font-semibold text-champagne">{f.step}</span>
                    <div>
                      <p className="font-semibold text-walnut">{f.title}</p>
                      <p className="text-sm text-stone">{f.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Product preview */}
            <div className="relative">
              <div className="rounded-3xl border border-border bg-paper p-6 shadow-lift sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-stone">{pick('West Lake Tea House · Room 3', '西湖茶舍 · 3 号房')}</p>
                  <DemoBadge label={pick('Example output', '示例输出')} />
                </div>
                <p className="mt-4 rounded-2xl bg-ivory p-4 text-[0.95rem] text-charcoal">
                  {pick('“Could we stay until 15:00 tomorrow? Our train leaves at 17:30.”', '“我们明天可以待到 15:00 吗？我们的火车 17:30 出发。”')}
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <PreviewCard label={pick('Task Type', '任务类型')} text={pick('**Booking** — changes the stay timing.', '**预订** —— 涉及入住时间调整。')} />
                  <PreviewCard label={pick('Matched Procedure', '匹配的操作规范')} text={pick('**PROC-HZ-LATE-01** · Late check-out request', '**PROC-HZ-LATE-01** · 延迟退房申请')} />
                  <PreviewCard
                    label={pick('Recommended Staff Action', '建议员工操作')}
                    text={pick('Check the next arrival; offer 13:00 free and seek **manager approval** for 15:00.', '先确认下一位入住客人的时间；可免费延至 13:00，延至 15:00 需**负责人审批**。')}
                    wide
                  />
                  <PreviewCard
                    label={pick('Guest Reply Draft', '客人回复草稿')}
                    text={pick('Thank you for sharing your train time. We’re checking tomorrow’s schedule and will confirm shortly.', '感谢您告知火车时间。我们正在确认明天的房间安排，稍后会尽快回复您。')}
                    wide
                  />
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs text-terracotta">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {pick('AI output is a draft. Staff must review it before taking action or replying.', 'AI 输出仅为草稿，员工必须审核后才能采取行动或回复客人。')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section aria-labelledby="safety" className="bg-night text-sand">
          <div className="mx-auto max-w-content px-4 py-24 sm:px-6">
            <p className="eyebrow text-champagne">{pick('Trust by design', '可信赖的设计')}</p>
            <h2 id="safety" className="mt-3 max-w-2xl text-4xl font-semibold text-paper sm:text-5xl">
              {pick('AI drafts. People decide.', 'AI 起草，员工决定。')}
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {(language === 'zh' ? [
                { icon: UserCheck, t: '人工审核', b: '任何回复都不会自动发送，必须由员工检查并确认。' },
                { icon: ShieldCheck, t: '不做高风险承诺', b: '退款、赔偿和价格问题始终需要升级审批，AI 不会擅自承诺。' },
                { icon: ScrollText, t: '完整操作记录', b: 'AI 分析、员工修改和最终操作都会记录时间与执行人。' },
                { icon: KeyRound, t: '密钥保存在服务器', b: '数据库与 AI 密钥只存在于安全的服务端函数中，不会暴露给浏览器。' },
              ] : [
                { icon: UserCheck, t: 'Human review', b: 'Nothing is sent to a guest until a staff member reviews and approves it.' },
                { icon: ShieldCheck, t: 'No risky promises', b: 'Refunds, compensation and prices are always escalated, never offered by AI.' },
                { icon: ScrollText, t: 'Full audit trail', b: 'AI analysis, staff edits and final actions are each logged with time and actor.' },
                { icon: KeyRound, t: 'Keys stay server-side', b: 'Database and AI credentials live only in secure server functions, never in the browser.' },
              ]).map(({ icon: Icon, t, b }) => (
                <div key={t} className="rounded-3xl border border-champagne/15 bg-paper/[0.03] p-6">
                  <Icon className="size-6 text-champagne" aria-hidden="true" />
                  <h3 className="mt-5 text-xl font-semibold text-paper">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-sand/75">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-content px-4 py-24 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-walnut px-8 py-16 text-center shadow-lift sm:px-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(198,154,82,0.28),transparent)]" />
            <ClipboardList className="relative mx-auto size-8 text-champagne" aria-hidden="true" />
            <h2 className="relative mt-5 text-4xl font-semibold text-paper sm:text-5xl">
              {pick('Bring calm to the next shift.', '让下一班员工从容接手。')}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sand/80">
              {pick('Open the workspace to see today’s tasks, or ask the assistant about a real guest message.', '打开工作台查看今日任务，或把真实客人问题交给 AI 助手分析。')}
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-champagne px-7 text-walnut hover:bg-sand">
                <Link to="/app">{pick('Open Workspace', '打开工作台')}</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-sand/30 bg-transparent px-7 text-sand hover:bg-paper/10 hover:text-paper"
              >
                <Link to="/app/assistant">{pick('Try the AI Assistant', '体验 AI 助手')}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function PreviewCard({ label, text, wide }: { label: string; text: string; wide?: boolean }) {
  return (
    <div className={`rounded-2xl border border-border bg-ivory/50 p-4 ${wide ? 'sm:col-span-2' : ''}`}>
      <p className="eyebrow text-champagne">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-charcoal">
        <RichText text={text} />
      </p>
    </div>
  )
}

