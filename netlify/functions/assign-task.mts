import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { registeredEmployeeEmails, requireManager, session } from './_lib/access.mts'
import { createRecord, FIELD_IDS, getRecord, listRecords, tableId, updateRecord } from './_lib/softr.mts'
import { task, user } from './_lib/normalise.mts'
import { notifyEmployee } from './_lib/push.mts'

type NetlifyContext = { waitUntil(promise: Promise<unknown>): void }

export default async (request: Request, context: NetlifyContext) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])
  try {
    const viewer = await session()
    const forbidden = requireManager(viewer)
    if (forbidden) return forbidden
    const body = await request.json() as Record<string, unknown>
    const recordId = String(body.record_id || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    if (!recordId || !email) return json({ error: 'Choose a task and employee.' }, 400)
    const staff = (await listRecords(tableId('users'))).map(user).find((item) => item.email.toLowerCase() === email && email !== viewer!.email)
    if (!staff) return json({ error: 'Employee not found.' }, 404)
    if (!(await registeredEmployeeEmails()).has(email)) return json({ error: 'The employee has not registered an account.' }, 400)
    const current = task(await getRecord(tableId('tasks'), recordId))
    if (staff.property_id && staff.property_id !== current.property_id) return json({ error: 'Employee belongs to a different property.' }, 400)
    if (current.assigned_user_record_id === staff.record_id) return json({ data: { task: current, unchanged: true } })
    await updateRecord(tableId('tasks'), recordId, { [FIELD_IDS.tasks.assigned_to]: staff.record_id })
    await createRecord(tableId('activityLogs'), {
      [FIELD_IDS.activityLogs.log_id]: `ASSIGN-${Date.now()}`,
      [FIELD_IDS.activityLogs.task_id]: recordId,
      [FIELD_IDS.activityLogs.actor_id]: viewer!.profile?.record_id || '',
      [FIELD_IDS.activityLogs.action]: `Manager ${viewer!.email} assigned task to ${email}.`,
      [FIELD_IDS.activityLogs.created_at]: new Date().toISOString(),
    })
    context.waitUntil(notifyEmployee(email, recordId).catch((reason) => console.error('Push delivery failed', reason)))
    return json({ data: { task: { ...current, assigned_to: staff.user_id, assigned_user_record_id: staff.record_id }, unchanged: false } })
  } catch (reason) {
    return safeError(reason)
  }
}
