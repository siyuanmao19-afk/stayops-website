import { Link } from '@tanstack/react-router'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Logo } from './Logo'

export const APP_NAV = [
  { to: '/app', label: 'Overview' },
  { to: '/app/assistant', label: 'AI Assistant' },
  { to: '/app/tasks', label: 'Tasks' },
  { to: '/app/procedures', label: 'Procedures' },
  { to: '/app/properties', label: 'Properties' },
  { to: '/app/activity', label: 'Activity Logs' },
] as const

export function SiteNav() {
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
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild className="hidden h-10 rounded-full px-5 sm:inline-flex">
            <Link to="/app">Open Workspace</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
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
                    {item.label}
                  </Link>
                ))}
                <Button asChild className="mt-4 h-11 rounded-full">
                  <Link to="/app">Open Workspace</Link>
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
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto grid max-w-content gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="font-display text-xl italic text-coffee">Manage Your Homestay Smarter</p>
          <p className="max-w-sm text-sm text-stone">
            A calm operations workspace for homestays: guest enquiries, house procedures and staff
            actions in one reviewed, auditable flow.
          </p>
        </div>
        <div>
          <p className="eyebrow mb-4 text-champagne">Workspace</p>
          <ul className="space-y-2 text-sm">
            {APP_NAV.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-stone hover:text-walnut">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-champagne">Principles</p>
          <ul className="space-y-2 text-sm text-stone">
            <li>AI drafts, people decide</li>
            <li>Every action logged</li>
            <li>Keys stay on the server</li>
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
