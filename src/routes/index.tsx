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

function Home() {
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
                AI-assisted homestay operations
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.02] text-walnut sm:text-6xl lg:text-7xl">
                Run every stay with calm, clarity and care.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-stone">
                StayOps brings guest enquiries, operating procedures and staff actions into one warm,
                intelligent workspace.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-12 rounded-full px-7 text-[0.95rem]">
                  <Link to="/app/assistant">
                    Try the AI Assistant <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-full border-walnut/20 bg-paper/60 px-7 text-[0.95rem] text-walnut"
                >
                  <a href="#workflow">Explore the workflow</a>
                </Button>
              </div>
              <p className="mt-8 font-display text-lg italic text-coffee">Manage Your Homestay Smarter</p>
            </div>
            <HeroCarousel />
          </div>
        </section>

        {/* Pain points */}
        <section aria-labelledby="pains" className="border-y border-border/70 bg-paper">
          <div className="mx-auto max-w-content px-4 py-20 sm:px-6">
            <p className="eyebrow text-champagne">The daily reality</p>
            <h2 id="pains" className="mt-3 max-w-2xl text-4xl font-semibold text-walnut sm:text-5xl">
              Small houses, many moving parts.
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
              {PAINS.map((p, i) => (
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
            <p className="eyebrow text-champagne">What StayOps does</p>
            <h2 id="capabilities" className="mt-3 text-4xl font-semibold text-walnut sm:text-5xl">
              Three quiet capabilities, working together.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {CAPABILITIES.map(({ icon: Icon, title, body }) => (
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
              <p className="eyebrow text-champagne">Properties</p>
              <h2 id="network" className="mt-3 text-4xl font-semibold text-walnut sm:text-5xl">
                Every stay, connected.
              </h2>
              <p className="mt-4 text-lg text-stone">
                See your homestay network by province and city — which houses are operating, and where
                tasks are waiting.
              </p>
            </div>
            <LocationGraph />
          </div>
        </section>

        {/* Workflow */}
        <section id="workflow" aria-labelledby="workflow-title" className="scroll-mt-20 mx-auto max-w-content px-4 py-24 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow text-champagne">AI workflow</p>
              <h2 id="workflow-title" className="mt-3 text-4xl font-semibold text-walnut sm:text-5xl">
                From a guest message to a reviewed answer.
              </h2>
              <p className="mt-4 text-lg text-stone">
                Every request follows the same path, so every shift works the same way — and every step
                leaves a record.
              </p>
              <ol className="mt-10 space-y-5">
                {FLOW.map((f) => (
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
                  <p className="text-sm font-medium text-stone">West Lake Tea House · Room 3</p>
                  <DemoBadge label="Example output" />
                </div>
                <p className="mt-4 rounded-2xl bg-ivory p-4 text-[0.95rem] text-charcoal">
                  “Could we stay until 15:00 tomorrow? Our train leaves at 17:30.”
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <PreviewCard label="Task Type" text="**Booking** — changes the stay timing." />
                  <PreviewCard label="Matched Procedure" text="**PROC-HZ-LATE-01** · Late check-out request" />
                  <PreviewCard
                    label="Recommended Staff Action"
                    text="Check the next arrival; offer 13:00 free and seek **manager approval** for 15:00."
                    wide
                  />
                  <PreviewCard
                    label="Guest Reply Draft"
                    text="Thank you for sharing your train time. We’re checking tomorrow’s schedule and will confirm shortly."
                    wide
                  />
                </div>
                <p className="mt-5 flex items-center gap-2 text-xs text-terracotta">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  AI output is a draft. Staff must review it before taking action or replying.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Safety */}
        <section aria-labelledby="safety" className="bg-night text-sand">
          <div className="mx-auto max-w-content px-4 py-24 sm:px-6">
            <p className="eyebrow text-champagne">Trust by design</p>
            <h2 id="safety" className="mt-3 max-w-2xl text-4xl font-semibold text-paper sm:text-5xl">
              AI drafts. People decide.
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: UserCheck, t: 'Human review', b: 'Nothing is sent to a guest until a staff member reviews and approves it.' },
                { icon: ShieldCheck, t: 'No risky promises', b: 'Refunds, compensation and prices are always escalated, never offered by AI.' },
                { icon: ScrollText, t: 'Full audit trail', b: 'AI analysis, staff edits and final actions are each logged with time and actor.' },
                { icon: KeyRound, t: 'Keys stay server-side', b: 'Database and AI credentials live only in secure server functions, never in the browser.' },
              ].map(({ icon: Icon, t, b }) => (
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
              Bring calm to the next shift.
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-sand/80">
              Open the workspace to see today’s tasks, or ask the assistant about a real guest message.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-12 rounded-full bg-champagne px-7 text-walnut hover:bg-sand">
                <Link to="/app">Open Workspace</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 rounded-full border-sand/30 bg-transparent px-7 text-sand hover:bg-paper/10 hover:text-paper"
              >
                <Link to="/app/assistant">Try the AI Assistant</Link>
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
