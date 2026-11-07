import {
  Link,
  useRouter,
  type ErrorComponentProps,
} from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

export function NotFoundPage() {
  const { pick } = useLanguage()
  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {pick('Page not found', '页面不存在')}
        </h1>
        <p className="text-muted-foreground">
          {pick('This page doesn’t exist. Check the address or return to the home page.', '该页面不存在，请检查网址或返回首页。')}
        </p>
        <Button asChild>
          <Link to="/">{pick('Go home', '返回首页')}</Link>
        </Button>
      </div>
    </main>
  )
}

export function RouteErrorPage({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const { pick } = useLanguage()

  return (
    <main className="grid min-h-svh place-items-center px-6 py-16">
      <div className="max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {pick('This page couldn’t load', '页面加载失败')}
        </h1>
        <p role="alert" className="text-muted-foreground">
          {pick('Please try again, or return to the home page.', '请重试，或返回首页。')}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button
            onClick={() => {
              void router.invalidate()
              reset()
            }}
          >
            {pick('Try again', '重试')}
          </Button>
          <Button variant="outline" asChild>
            <a href="/">{pick('Go home', '返回首页')}</a>
          </Button>
        </div>
      </div>
    </main>
  )
}
