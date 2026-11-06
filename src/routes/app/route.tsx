import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import {
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  History,
  LayoutDashboard,
  Menu,
  ScrollText,
  Sparkles,
} from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { DataProvider } from '@/lib/data-context'
import { useLanguage } from '@/lib/language'
import { LanguageToggle } from '@/components/brand/SiteNav'

export const Route = createFileRoute('/app')({
  component: AppLayout,
})

const ITEMS = [
  { to: '/app', label: 'Overview', labelZh: '概览', icon: LayoutDashboard, exact: true },
  { to: '/app/assistant', label: 'AI Assistant', labelZh: 'AI 助手', icon: Sparkles },
  { to: '/app/tasks', label: 'Tasks', labelZh: '任务', icon: ClipboardList },
  { to: '/app/procedures', label: 'Procedures', labelZh: '操作规范', icon: ScrollText },
  { to: '/app/properties', label: 'Properties', labelZh: '房源', icon: Building2 },
  { to: '/app/analytics', label: 'Analytics', labelZh: '数据分析', icon: ChartNoAxesCombined },
  { to: '/app/activity', label: 'Activity Logs', labelZh: '活动日志', icon: History },
] as const

function NavList() {
  const { language } = useLanguage()
  return (
    <ul className="space-y-1">
      {ITEMS.map(({ to, label, labelZh, icon: Icon, ...rest }) => (
        <li key={to}>
          <Link
            to={to}
            activeOptions={{ exact: 'exact' in rest }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-stone transition-colors hover:bg-sand/30 hover:text-walnut data-[status=active]:bg-walnut data-[status=active]:text-paper"
          >
            <Icon className="size-4" aria-hidden="true" />
            {language === 'zh' ? labelZh : label}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function AppLayout() {
  const { pick } = useLanguage()
  return (
    <div className="min-h-screen bg-ivory lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-paper px-4 py-6 lg:flex">
        <Link to="/" className="px-2" aria-label="StayOps home">
          <Logo />
        </Link>
        <nav aria-label={pick('Workspace', '工作台')} className="mt-10 flex-1">
          <NavList />
        </nav>
        <p className="px-3 text-xs leading-relaxed text-stone">
          {pick('AI output is always a draft. Staff review every reply.', 'AI 输出始终是草稿，每条回复都需员工审核。')}
        </p>
        <div className="mt-4 px-3"><LanguageToggle /></div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-paper/90 px-4 backdrop-blur lg:hidden">
        <Link to="/" aria-label="StayOps home">
          <Logo />
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={pick('Open workspace menu', '打开工作台菜单')}>
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-paper p-5 pt-12">
            <SheetTitle className="sr-only">{pick('Workspace menu', '工作台菜单')}</SheetTitle>
            <SheetDescription className="sr-only">{pick('Navigate between workspace screens', '在工作台页面之间切换')}</SheetDescription>
            <div className="mb-5"><LanguageToggle /></div>
            <NavList />
          </SheetContent>
        </Sheet>
      </header>

      <main className="min-w-0 px-4 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <DataProvider><Outlet /></DataProvider>
        </div>
      </main>
    </div>
  )
}

