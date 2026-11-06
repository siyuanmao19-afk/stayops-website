import { createFileRoute } from '@tanstack/react-router'
import { Bot, Cog, UserRound } from 'lucide-react'
import { PageHeader } from '@/components/app/PageHeader'
import { DEMO_ACTIVITY_LOGS, DEMO_TASKS, type Actor } from '@/lib/fixtures'

export const Route = createFileRoute('/app/activity')({
  component: ActivityPage,
})

const ACTOR: Record<Actor, { icon: typeof Bot; cls: string }> = {
  AI: { icon: Bot, cls: 'bg-champagne text-walnut' },
  Staff: { icon: UserRound, cls: 'bg-sage text-paper' },
  System: { icon: Cog, cls: 'bg-stone text-paper' },
}

const fmt = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Shanghai' })

function ActivityPage() {
  const logs = [...DEMO_ACTIVITY_LOGS].sort((a, b) => b.created_at.localeCompare(a.created_at))
  return (
    <>
      <PageHeader
        eyebrow="Activity Logs"
        title="A clear audit trail"
        description="Every AI analysis, staff edit and system change, in order. Entries are never edited or deleted."
      />
      <div className="mb-6 flex flex-wrap gap-4 text-sm text-stone">
        {(Object.keys(ACTOR) as Actor[]).map((a) => {
          const { icon: Icon, cls } = ACTOR[a]
          return (
            <span key={a} className="inline-flex items-center gap-2">
              <span className={`grid size-6 place-items-center rounded-full ${cls}`}><Icon className="size-3.5" aria-hidden="true" /></span>
              {a}
            </span>
          )
        })}
      </div>
      <ol className="relative space-y-4 border-l border-champagne/40 pl-8">
        {logs.map((l) => {
          const { icon: Icon, cls } = ACTOR[l.actor]
          const task = DEMO_TASKS.find((t) => t.id === l.task_id)
          return (
            <li key={l.id} className="relative">
              <span className={`absolute -left-12 top-4 grid size-8 place-items-center rounded-full ring-4 ring-ivory ${cls}`}>
                <Icon className="size-4" aria-label={l.actor} />
              </span>
              <div className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-walnut">{l.action}</p>
                  <time dateTime={l.created_at} className="text-xs text-stone">{fmt.format(new Date(l.created_at))}</time>
                </div>
                <p className="mt-1 text-sm text-stone">
                  {l.actor_name} · <span className="font-mono text-xs">{l.task_id}</span>
                  {task ? ` — ${task.title}` : ''}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </>
  )
}
