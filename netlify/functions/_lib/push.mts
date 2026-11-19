import { admin } from '@netlify/identity'
import { sendNotification, setVapidDetails } from 'web-push'

type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } }

export async function notifyEmployee(email: string, taskId: string) {
  const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim()
  const subject = process.env.VAPID_SUBJECT?.trim()
  if (!publicKey || !privateKey || !subject) return
  setVapidDetails(subject, publicKey, privateKey)
  for (let page = 1; page <= 20; page += 1) {
    const users = await admin.listUsers({ page, perPage: 100 })
    const recipient = users.find((item) => item.email?.toLowerCase() === email)
    if (recipient) {
      const subscriptions = Array.isArray(recipient.appMetadata?.push_subscriptions)
        ? recipient.appMetadata.push_subscriptions as Subscription[] : []
      await Promise.allSettled(subscriptions.map((subscription) => sendNotification(subscription, JSON.stringify({
        title: 'StayOps 新任务',
        body: '经理给你分配了一项任务。点击查看。',
        url: `/app/tasks?task=${encodeURIComponent(taskId)}`,
      }))))
      return
    }
    if (users.length < 100) return
  }
}
