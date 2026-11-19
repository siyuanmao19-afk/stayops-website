import { admin, verifyRequestOrigin } from '@netlify/identity'
import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { requireSession, session } from './_lib/access.mts'

type Subscription = { endpoint: string; keys: { p256dh: string; auth: string } }

export default async (request: Request) => {
  if (!['GET', 'POST'].includes(request.method)) return methodNotAllowed(['GET', 'POST'])
  try {
    const viewer = await session()
    const unauthorized = requireSession(viewer)
    if (unauthorized) return unauthorized
    const publicKey = process.env.VAPID_PUBLIC_KEY?.trim()
    if (!publicKey) return json({ error: 'Phone notifications are not configured.' }, 503)
    if (request.method === 'GET') return json({ data: { public_key: publicKey } })
    verifyRequestOrigin(request)
    const subscription = await request.json() as Subscription
    if (!subscription.endpoint?.startsWith('https://') || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return json({ error: 'Invalid push subscription.' }, 400)
    }
    const identity = await admin.getUser(viewer!.identity.id)
    if (!identity) return json({ error: 'Identity account not found.' }, 404)
    const existing = Array.isArray(identity.appMetadata?.push_subscriptions)
      ? identity.appMetadata.push_subscriptions as Subscription[] : []
    const subscriptions = [...existing.filter((item) => item.endpoint !== subscription.endpoint), subscription].slice(-5)
    await admin.updateUser(identity.id, { app_metadata: { ...identity.appMetadata, push_subscriptions: subscriptions } })
    return json({ data: { enabled: true } })
  } catch (reason) {
    return safeError(reason)
  }
}
