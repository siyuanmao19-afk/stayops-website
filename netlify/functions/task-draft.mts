import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { createRecord, FIELD_IDS, getRecord, tableId, updateRecord } from './_lib/softr.mts'
import { toEnglish } from './_lib/translate.mts'
import { ownsTask, requireSession, session } from './_lib/access.mts'
import { task } from './_lib/normalise.mts'

const STATUS = new Set(['Open', 'In Progress', 'Pending Approval', 'Escalated', 'Draft Ready', 'Resolved'])

type NetlifyContext = {
  waitUntil(promise: Promise<unknown>): void
}

export default async (request: Request, context: NetlifyContext) => {
  if (request.method !== 'PATCH') return methodNotAllowed(['PATCH'])
  const viewer = await session()
  const unauthorized = requireSession(viewer)
  if (unauthorized) return unauthorized
  try {
    const body = await request.json() as Record<string, unknown>
    const recordId = String(body.record_id || '').trim()
    const taskId = String(body.task_id || '').trim()
    const draft = String(body.draft_response || '').trim()
    const status = String(body.status || '').trim()
    if (!recordId || !taskId) return json({ error: 'Task identity is missing.' }, 400)
    const current = task(await getRecord(tableId('tasks'), recordId))
    if (current.id !== taskId || !ownsTask(viewer!, current.assigned_to, current.assigned_user_record_id)) return json({ error: 'Task not found.' }, 404)
    if (draft.length > 2000) return json({ error: 'Reply draft must contain at most 2000 characters.' }, 400)
    if (!STATUS.has(status)) return json({ error: 'Invalid task status.' }, 400)

    // Softr is kept in English: staff may edit in Chinese, so translate before writing.
    const englishDraft = draft ? (await toEnglish(draft)).slice(0, 2000) : ''
    const updated = await updateRecord(tableId('tasks'), recordId, {
      [FIELD_IDS.tasks.draft_response]: englishDraft,
      [FIELD_IDS.tasks.status]: status,
    })
    const action = (await toEnglish(String(body.action || `Updated reply draft and set status to ${status}`).trim())).slice(0, 1000)
    context.waitUntil(
      createRecord(tableId('activityLogs'), {
        [FIELD_IDS.activityLogs.log_id]: `WEB-${Date.now()}`,
        [FIELD_IDS.activityLogs.task_id]: recordId,
        [FIELD_IDS.activityLogs.actor_id]: viewer!.profile?.record_id || '',
        [FIELD_IDS.activityLogs.action]: `${viewer!.manager ? 'Manager' : 'Staff'} ${viewer!.email}: ${action}`,
        [FIELD_IDS.activityLogs.created_at]: new Date().toISOString(),
      }).catch((reason) => {
        console.error('Could not write task Activity Log', reason)
      }),
    )
    return json({ data: { task: updated, log_queued: true } })
  } catch (reason) {
    return safeError(reason)
  }
}



