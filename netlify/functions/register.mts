import { admin, verifyRequestOrigin } from '@netlify/identity'
import { json, methodNotAllowed, safeError } from './_lib/http.mts'

declare const Netlify: {
  env: { get(name: string): string | undefined }
}

async function digest(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}

async function matchesInviteCode(provided: string, expected: string) {
  const [left, right] = await Promise.all([digest(provided.trim()), digest(expected.trim())])
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

export default async (request: Request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])

  try {
    verifyRequestOrigin(request)
    const expectedCode = Netlify.env.get('STAYOPS_INVITE_CODE')?.trim()
    if (!expectedCode) {
      return json({ error: 'Registration is temporarily unavailable. The invite code has not been configured.' }, 503)
    }

    const body = await request.json() as Record<string, unknown>
    const name = String(body.name || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const inviteCode = String(body.invite_code || '').trim()

    if (!name || name.length > 100) return json({ error: 'Enter a name of 1–100 characters.' }, 400)
    if (!email || email.length > 254 || !email.includes('@')) return json({ error: 'Enter a valid email address.' }, 400)
    if (password.length < 8 || password.length > 128) return json({ error: 'Password must contain 8–128 characters.' }, 400)
    if (!inviteCode || inviteCode.length > 128 || !(await matchesInviteCode(inviteCode, expectedCode))) {
      return json({ error: 'The registration code is incorrect.' }, 403)
    }

    await admin.createUser({
      email,
      password,
      data: { user_metadata: { full_name: name } },
    })

    return json({ data: { created: true } }, 201)
  } catch (reason) {
    return safeError(reason)
  }
}

export const config = {
  rateLimit: {
    action: 'rate_limit' as const,
    aggregateBy: ['ip'] as const,
    windowSize: 60,
    windowLimit: 10,
  },
}

