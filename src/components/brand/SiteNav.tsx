import { Link } from '@tanstack/react-router'
import { Languages, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from './Logo'
import { useLanguage } from '@/lib/language'

export const APP_NAV = [
  { to: '/app', label: 'Overview', labelZh: '概览' },
  { to: '/app/assistant', label: 'AI Assistant', labelZh: 'AI 助手' },
  { to: '/app/tasks', label: 'Tasks', labelZh: '任务' },
  { to: '/app/procedures', label: 'Procedures', labelZh: '操作规范' },
  { to: '/app/properties', label: 'Properties', labelZh: '房源' },
  { to: '/app/analytics', label: 'Analytics', labelZh: '数据分析' },
  { to: '/app/activity', label: 'Activity Logs', labelZh: '活动日志' },
] as const

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { language, toggleLanguage, pick } = useLanguage()
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'sm'}
      onClick={toggleLanguage}
      aria-label={pick('Switch to Chinese', '切换到英文')}
      title={pick('切换中文', 'Switch to English')}
      className={compact ? 'rounded-full' : 'rounded-full border-walnut/20 bg-paper/70'}
    >
      <Languages className="size-4" />
      {!compact && <span>{language === 'en' ? '中文' : 'EN'}</span>}
    </Button>
  )
}

export function SiteNav() {
  const { language, pick } = useLanguage()
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-6 px-4 sm:px-6">
        <Link to="/" aria-label="StayOps home" className="rounded-lg">
          <Logo />
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {APP_NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="rounded-full px-3 py-2 text-sm font-medium text-stone transition-colors hover:bg-sand/40 hover:text-walnut"
                >
                  {language === 'zh' ? item.labelZh : item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button asChild className="hidden h-10 rounded-full px-5 sm:inline-flex">
            <Link to="/app">{pick('Open Workspace', '打开工作台')}</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label={pick('Open menu', '打开菜单')}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-paper">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigate StayOps</SheetDescription>
              <div className="flex flex-col gap-1 p-6 pt-12">
                {APP_NAV.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="rounded-xl px-3 py-3 font-medium text-walnut hover:bg-sand/40"
                  >
                    {language === 'zh' ? item.labelZh : item.label}
                  </Link>
                ))}
                <Button asChild className="mt-4 h-11 rounded-full">
                  <Link to="/app">{pick('Open Workspace', '打开工作台')}</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  const { language, pick } = useLanguage()
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="font-display text-xl italic text-coffee">{pick('Manage Your Homestay Smarter', '让民宿运营更聪明')}</p>
          <p className="max-w-sm text-sm text-stone">
            {pick(
              'A calm operations workspace for homestays: guest enquiries, house procedures and staff actions in one reviewed, auditable flow.',
              '一个从容、清晰的民宿运营工作台，把客人咨询、房源规范和员工操作放进可审核、可追踪的流程。',
            )}
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4 text-champagne">{pick('Workspace', '工作台')}</p>
          <ul className="space-y-2 text-sm">
            {APP_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-stone hover:text-walnut">
                  {language === 'zh' ? item.labelZh : item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-champagne">{pick('Principles', '设计原则')}</p>
          <ul className="space-y-2 text-sm text-stone">
            <li>{pick('AI drafts, people decide', 'AI 起草，员工决定')}</li>
            <li>{pick('Every action logged', '每一步操作都有记录')}</li>
            <li>{pick('Keys stay on the server', '密钥只保存在服务器')}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70">
        <p className="mx-auto max-w-content px-4 py-5 text-xs text-stone sm:px-6">
          © {new Date().getFullYear()} StayOps
        </p>
      </div>
    </footer>
  )
}

