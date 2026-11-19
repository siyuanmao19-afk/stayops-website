import { admin, getUser } from '@netlify/identity'
import { json } from './http.mts'
import { createRecord, FIELD_IDS, listRecords, tableId, type SoftrRecord } from './softr.mts'
import { task as normaliseTask, user as normaliseUser } from './normalise.mts'

const MANAGER_EMAIL = 'siyuanmao19@gmail.com'
const profileCreations = new Map<string, Promise<SoftrRecord>>()

export function uniqueUsersByEmail(rows: SoftrRecord[]) {
  const profiles = new Map<string, ReturnType<typeof normaliseUser>>()
  for (const row of [...rows].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))) {
    const profile = normaliseUser(row)
    const email = profile.email.trim().toLowerCase()
    if (email && !profiles.has(email)) profiles.set(email, profile)
  }
  return [...profiles.values()]
}

function createMissingProfile(identity: { id: string; name?: string }, email: string) {
  let pending = profileCreations.get(identity.id)
  if (!pending) {
    pending = (async () => {
      const existing = (await listRecords(tableId('users'))).find((row) => {
        const profile = normaliseUser(row)
        return profile.email.trim().toLowerCase() === email && profile.user_id === identity.id
      })
      return existing ?? createRecord(tableId('users'), {
        [FIELD_IDS.users.user_id]: identity.id,
        [FIELD_IDS.users.name]: identity.name || email.split('@')[0],
        [FIELD_IDS.users.email]: email,
      })
    })()
    profileCreations.set(identity.id, pending)
    void pending.finally(() => profileCreations.delete(identity.id)).catch(() => undefined)
  }
  return pending
}

export async function session() {
  const identity = await getUser()
  const email = String(identity?.email || '').trim().toLowerCase()
  if (!identity || !email) return null
  const manager = email === MANAGER_EMAIL
  const users = await listRecords(tableId('users'))
  const matching = [...users].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id))
    .map(normaliseUser).filter((item) => item.email.trim().toLowerCase() === email)
  let profile = matching.find((item) => item.user_id === identity.id) ?? matching[0]
  if (!profile && !manager) {
    const created = await createMissingProfile(identity, email)
    profile = normaliseUser(created)
  }
  const profileRecordIds = [...new Set([
    ...matching.filter((item) => item.user_id === identity.id).map((item) => item.record_id),
    ...(profile ? [profile.record_id] : []),
  ])]
  return { identity, email, manager, profile, profileRecordIds }
}

export function requireSession(value: Awaited<ReturnType<typeof session>>) {
  return value ? null : json({ error: 'Please sign in.' }, 401)
}

export function requireManager(value: Awaited<ReturnType<typeof session>>) {
  return !value ? json({ error: 'Please sign in.' }, 401)
    : !value.manager ? json({ error: 'Manager access is required.' }, 403) : null
}

export function ownsTask(value: NonNullable<Awaited<ReturnType<typeof session>>>, assignedTo: string, assignedRecordId: string) {
  return value.manager || Boolean(assignedRecordId && (value.profileRecordIds ?? [value.profile?.record_id]).includes(assignedRecordId)) || assignedTo.trim().toLowerCase() === value.email
}

export function visibleTasks(value: NonNullable<Awaited<ReturnType<typeof session>>>, rows: Awaited<ReturnType<typeof listRecords>>) {
  return rows.map(normaliseTask).filter((item) => ownsTask(value, item.assigned_to, item.assigned_user_record_id))
}

export async function registeredEmployeeEmails() {
  const emails = new Set<string>()
  for (let page = 1; page <= 20; page += 1) {
    const users = await admin.listUsers({ page, perPage: 100 })
    for (const item of users) if (item.email) emails.add(item.email.toLowerCase())
    if (users.length < 100) break
  }
  emails.delete(MANAGER_EMAIL)
  return emails
}
