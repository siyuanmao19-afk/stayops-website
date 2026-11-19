import { admin, getUser } from '@netlify/identity'
import { json } from './http.mts'
import { createRecord, FIELD_IDS, listRecords, tableId } from './softr.mts'
import { task as normaliseTask, user as normaliseUser } from './normalise.mts'

const MANAGER_EMAIL = 'siyuanmao19@gmail.com'

export async function session() {
  const identity = await getUser()
  const email = String(identity?.email || '').trim().toLowerCase()
  if (!identity || !email) return null
  const manager = email === MANAGER_EMAIL
  const users = await listRecords(tableId('users'))
  let profile = users.map(normaliseUser).find((item) => item.email.trim().toLowerCase() === email)
  if (!profile && !manager) {
    const created = await createRecord(tableId('users'), {
      [FIELD_IDS.users.user_id]: identity.id,
      [FIELD_IDS.users.name]: identity.name || email.split('@')[0],
      [FIELD_IDS.users.email]: email,
    })
    profile = normaliseUser(created)
  }
  return { identity, email, manager, profile }
}

export function requireSession(value: Awaited<ReturnType<typeof session>>) {
  return value ? null : json({ error: 'Please sign in.' }, 401)
}

export function requireManager(value: Awaited<ReturnType<typeof session>>) {
  return !value ? json({ error: 'Please sign in.' }, 401)
    : !value.manager ? json({ error: 'Manager access is required.' }, 403) : null
}

export function ownsTask(value: NonNullable<Awaited<ReturnType<typeof session>>>, assignedTo: string, assignedRecordId: string) {
  return value.manager || (Boolean(value.profile) && assignedRecordId === value.profile!.record_id) || assignedTo.trim().toLowerCase() === value.email
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
