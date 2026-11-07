import { FormEvent, useEffect, useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { getSettings } from '@netlify/identity'
import { ArrowLeft, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { z } from 'zod'
import { Logo } from '@/components/brand/Logo'
import { LanguageToggle } from '@/components/brand/SiteNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/language'

const searchSchema = z.object({ redirect: z.string().optional().catch('/app') })

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  component: LoginPage,
})

function LoginPage() {
  const { redirect = '/app' } = Route.useSearch()
  const { user, loading, login, signup } = useAuth()
  const { pick } = useLanguage()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signupEnabled, setSignupEnabled] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && user) window.location.assign(safeRedirect(redirect))
  }, [loading, redirect, user])

  useEffect(() => {
    void getSettings()
      .then((settings) => setSignupEnabled(!settings.disableSignup))
      .catch(() => setSignupEnabled(true))
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
        window.location.assign(safeRedirect(redirect))
      } else {
        const created = await signup(email.trim(), password, name.trim())
        if (created.confirmedAt) {
          window.location.assign(safeRedirect(redirect))
        } else {
          setMessage(pick('Account created. Check your email to confirm it, then sign in.', '账号已创建。请先查收确认邮件，然后返回登录。'))
          setMode('login')
          setPassword('')
        }
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : pick('Unable to continue. Please try again.', '暂时无法继续，请重试。'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ivory px-4 py-10">
      <div className="pointer-events-none absolute -left-36 -top-40 size-[480px] rounded-full bg-sand/45 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 size-[520px] rounded-full bg-champagne/15 blur-3xl" />
      <div className="absolute left-4 top-4 flex items-center gap-2 sm:left-8 sm:top-7">
        <Button asChild variant="ghost" size="sm" className="rounded-full text-stone">
          <Link to="/"><ArrowLeft className="size-4" />{pick('Home', '返回首页')}</Link>
        </Button>
      </div>
      <div className="absolute right-4 top-4 sm:right-8 sm:top-7"><LanguageToggle /></div>

      <section className="relative w-full max-w-md rounded-3xl border border-border bg-paper/95 p-7 shadow-lift backdrop-blur sm:p-9">
        <Logo className="mx-auto h-12" />
        <div className="mt-7 text-center">
          <p className="eyebrow text-champagne">{pick('StayOps workspace', 'StayOps 工作台')}</p>
          <h1 className="mt-2 text-4xl font-semibold text-walnut">
            {mode === 'login' ? pick('Welcome back', '欢迎回来') : pick('Create your account', '创建账号')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone">
            {mode === 'login'
              ? pick('Sign in to manage tasks and ask the AI assistant.', '登录后即可管理任务并使用 AI 助手。')
              : pick('Anyone can register with an email address.', '任何人都可以使用邮箱注册。')}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-full bg-ivory p-1">
          <button type="button" onClick={() => setMode('login')} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-walnut text-paper shadow-soft' : 'text-stone'}`}>
            {pick('Sign in', '登录')}
          </button>
          <button type="button" disabled={!signupEnabled} onClick={() => setMode('signup')} className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${mode === 'signup' ? 'bg-walnut text-paper shadow-soft' : 'text-stone'}`}>
            {pick('Register', '注册')}
          </button>
        </div>

        <form className="mt-7 space-y-5" onSubmit={submit}>
          {mode === 'signup' && (
            <div className="space-y-2">
              <Label htmlFor="name">{pick('Name', '姓名')}</Label>
              <div className="relative"><UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" /><Input id="name" value={name} onChange={(event) => setName(event.target.value)} required className="h-11 rounded-xl pl-10" autoComplete="name" /></div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{pick('Email', '邮箱')}</Label>
            <div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" /><Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 rounded-xl pl-10" autoComplete="email" /></div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{pick('Password', '密码')}</Label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone" />
              <Input id="password" type={showPassword ? 'text' : 'password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11 rounded-xl px-10" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone" aria-label={pick('Show or hide password', '显示或隐藏密码')}>
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {mode === 'signup' && <p className="text-xs text-stone">{pick('Use at least 8 characters.', '请至少使用 8 个字符。')}</p>}
          </div>
          {message && <p className="rounded-xl bg-sage/10 px-4 py-3 text-sm text-sage" role="status">{message}</p>}
          {error && <p className="rounded-xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta" role="alert">{error}</p>}
          <Button type="submit" disabled={submitting} className="h-12 w-full rounded-full">
            {submitting && <LoaderCircle className="animate-spin" />}
            {mode === 'login' ? pick('Sign in to workspace', '登录工作台') : pick('Create account', '创建账号')}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs leading-relaxed text-stone">
          {pick('This is a simple member login. All registered users currently have the same workspace access.', '这是简易成员登录；目前所有注册用户拥有相同的工作台权限。')}
        </p>
      </section>
    </main>
  )
}

function safeRedirect(value: string) {
  return value.startsWith('/app') ? value : '/app'
}

