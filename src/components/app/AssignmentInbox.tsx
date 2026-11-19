import { useEffect, useRef, useState } from 'react'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { getNotifications, getPushPublicKey, savePushSubscription, type AssignmentNotice } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useLanguage } from '@/lib/language'
import { Button } from '@/components/ui/button'

export function AssignmentInbox() {
  const { user } = useAuth()
  const { pick } = useLanguage()
  const [notices, setNotices] = useState<AssignmentNotice[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [seen, setSeen] = useState('')
  const [pushState, setPushState] = useState<'idle' | 'working' | 'enabled'>('idle')
  const latestNotice = useRef('')
  const email = user?.email?.toLowerCase() || ''

  useEffect(() => {
    if (!email || email === 'siyuanmao19@gmail.com') return
    let active = true
    const poll = async () => {
      try {
        const incoming = await getNotifications()
        if (!active) return
        setError('')
        setNotices(incoming)
        if (latestNotice.current && incoming[0] && incoming[0].id !== latestNotice.current) {
          toast.info(pick('A task was assigned to you', '经理给你分配了新任务'), { description: incoming[0].title })
        }
        latestNotice.current = incoming[0]?.id || ''
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : pick('Notifications unavailable', '消息暂不可用'))
      }
    }
    void poll()
    const timer = window.setInterval(() => void poll(), 10000)
    return () => { active = false; window.clearInterval(timer) }
  }, [email, pick])

  if (!email || email === 'siyuanmao19@gmail.com') return null
  const lastSeen = seen || localStorage.getItem(`stayops-notices-seen:${email}`) || ''
  const unread = notices.filter((item) => item.id !== lastSeen && (!lastSeen || item.created_at > (notices.find((notice) => notice.id === lastSeen)?.created_at || ''))).length
  return (
    <div className="relative">
      <Button type="button" variant="ghost" size="sm" className="rounded-full" onClick={() => {
        setOpen((value) => !value)
        if (notices[0]) {
          setSeen(notices[0].id)
          localStorage.setItem(`stayops-notices-seen:${email}`, notices[0].id)
        }
      }} aria-label={pick('Notifications', '消息通知')}>
        <Bell className="size-4" />{unread > 0 && <span className="rounded-full bg-terracotta px-1.5 text-xs text-paper">{unread}</span>}
      </Button>
      {open && <div className="absolute right-0 top-10 z-50 w-72 rounded-xl border border-border bg-paper p-3 shadow-lift">
        <p className="mb-2 text-sm font-semibold text-walnut">{pick('Assigned tasks', '收到的任务')}</p>
        {error && <p className="text-xs text-terracotta">{error}</p>}
        {notices.length ? notices.map((item) => <a key={item.id} href={`/app/tasks?task=${encodeURIComponent(item.task_id)}`} className="block border-t border-border py-2 text-sm text-charcoal hover:text-walnut">{item.title}</a>) : <p className="text-sm text-stone">{pick('No assignments yet.', '暂无分配消息。')}</p>}
        <Button type="button" size="sm" variant="outline" className="mt-3 w-full rounded-full" disabled={pushState !== 'idle'} onClick={async () => {
          setPushState('working')
          try {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) throw new Error(pick('This browser does not support push notifications.', '当前浏览器不支持推送通知。'))
            const permission = await Notification.requestPermission()
            if (permission !== 'granted') throw new Error(pick('Notification permission was not granted.', '未获得通知权限。'))
            const { public_key } = await getPushPublicKey()
            const registration = await navigator.serviceWorker.register('/sw.js')
            const padding = '='.repeat((4 - public_key.length % 4) % 4)
            const bytes = atob((public_key + padding).replace(/-/g, '+').replace(/_/g, '/'))
            const applicationServerKey = Uint8Array.from(bytes, (character) => character.charCodeAt(0))
            const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })
            await savePushSubscription(subscription)
            setPushState('enabled')
            toast.success(pick('Phone notifications enabled', '手机通知已开启'))
          } catch (reason) {
            setPushState('idle')
            toast.error(reason instanceof Error ? reason.message : pick('Could not enable notifications', '无法开启通知'))
          }
        }}>{pushState === 'enabled' ? pick('Notifications enabled', '通知已开启') : pushState === 'working' ? pick('Enabling…', '正在开启…') : pick('Enable phone notifications', '开启手机通知')}</Button>
      </div>}
    </div>
  )
}
