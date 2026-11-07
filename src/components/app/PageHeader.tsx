import { translateValue, useLanguage } from '@/lib/language'

const UI_ZH: Record<string, string> = {
  'Overview': '概览',
  'Today at a glance': '今日运营概况',
  'Live operations across every StayOps property.': '实时查看 StayOps 所有房源的运营情况。',
  'AI Assistant': 'AI 助手',
  'Ask StayOps AI': '向 StayOps AI 提问',
  'Paste a guest message. StayOps classifies it, matches the property’s own procedure and drafts a reply for you to review.': '粘贴客人的消息，StayOps 会识别任务类型、匹配该房源的操作规范，并生成一份供员工审核的回复草稿。',
  'Tasks': '任务',
  'Every request, in one place': '所有请求，集中处理',
  'Original AI analysis stays untouched. Staff can refine the reply draft and move the status forward.': '原始 AI 分析会被保留，员工可以修改回复草稿并推进任务状态。',
  'Procedures': '操作规范',
  'House rules, written down': '把房源规则清楚记录下来',
  'Live, property-specific operating procedures and approval boundaries.': '实时查看各房源专属的操作流程和审批边界。',
  'Properties': '房源',
  'Your houses': '你的民宿房源',
  'Live property records and the work currently waiting at each homestay.': '实时查看房源资料和每家民宿当前待处理的工作。',
  'Analytics': '数据分析',
  'Operations, made visible': '让运营数据清晰可见',
  'Live patterns calculated from Properties, Users, Tasks, Customers and Activity Logs — no separate analytics database required.': '根据房源、用户、任务、客户和活动日志实时计算，无需单独建立分析数据库。',
  'Activity Logs': '活动日志',
  'A clear audit trail': '清晰可追踪的操作记录',
  'Live AI analyses, staff edits and system changes from Softr.': '实时记录来自 Softr 的 AI 分析、员工修改和系统变更。',
  'No activity yet': '暂无活动记录',
  'Task edits and AI analyses will appear here.': '任务修改和 AI 分析会显示在这里。',
  'No procedures found': '未找到操作规范',
  'This property may not have a written procedure for that request yet.': '该房源可能还没有针对这一请求的书面流程。',
  'No tasks match': '没有符合条件的任务',
  'Try clearing a filter or searching for a different word.': '试试清除筛选条件，或换个关键词搜索。',
}

function zh(value: string) { return UI_ZH[value] ?? value }

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
}) {
  const { language } = useLanguage()
  const local = (value: string) => language === 'zh' ? zh(value) : value
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <p className="eyebrow text-champagne">{local(eyebrow)}</p>
        <h1 className="mt-2 text-4xl font-semibold text-walnut sm:text-5xl">{local(title)}</h1>
        <p className="mt-2 text-stone">{local(description)}</p>
      </div>
      {actions}
    </div>
  )
}

export function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  const { language } = useLanguage()
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-champagne/40 bg-paper/60 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-sand/40 text-coffee">{icon}</span>
      <p className="mt-4 font-display text-2xl font-semibold text-walnut">{language === 'zh' ? zh(title) : title}</p>
      <p className="mt-1 max-w-sm text-sm text-stone">{language === 'zh' ? zh(body) : body}</p>
    </div>
  )
}

export function TypeBadge({ type }: { type: string }) {
  const { language } = useLanguage()
  const styles: Record<string, string> = {
    Safety: 'bg-terracotta/12 text-terracotta border-terracotta/25',
    Maintenance: 'bg-champagne/15 text-coffee border-champagne/30',
    Housekeeping: 'bg-sage/15 text-sage border-sage/30',
    'Review response': 'bg-walnut/8 text-walnut border-walnut/15',
    'Guest enquiry': 'bg-sand/40 text-coffee border-sand',
    'Guest issue': 'bg-terracotta/10 text-terracotta border-terracotta/25',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[type] ?? 'border-border text-stone'}`}>
      {translateValue(type, language)}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const { language } = useLanguage()
  const styles: Record<string, string> = {
    Open: 'bg-paper text-walnut border-walnut/20',
    'In Progress': 'bg-champagne/15 text-coffee border-champagne/30',
    'Pending Approval': 'bg-terracotta/10 text-terracotta border-terracotta/25',
    Escalated: 'bg-terracotta text-paper border-terracotta',
    'Draft Ready': 'bg-sand/45 text-coffee border-sand',
    Resolved: 'bg-sage/15 text-sage border-sage/30',
  }
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? 'border-border text-stone'}`}>
      {translateValue(status, language)}
    </span>
  )
}

export function ApprovalTag({ level, rule }: { level: 'none' | 'manager' | 'owner'; rule: string }) {
  const cls =
    level === 'owner'
      ? 'bg-terracotta/10 text-terracotta border-terracotta/25'
      : level === 'manager'
        ? 'bg-champagne/15 text-coffee border-champagne/35'
        : 'bg-sage/15 text-sage border-sage/30'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {rule}
    </span>
  )
}

