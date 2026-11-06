import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { createRecord, FIELD_IDS, tableId, updateRecord } from './_lib/softr.mts'

const STATUS = new Set(['Open', 'In Progress', 'Pending Approval', 'Escalated', 'Draft Ready', 'Resolved'])

export default async (request: Request) => {
  if (request.method !== 'PATCH') return methodNotAllowed(['PATCH'])
  try {
    const body = await request.json() as Record<string, unknown>
    const recordId = String(body.record_id || '').trim()
    const taskId = String(body.task_id || '').trim()
    const draft = String(body.draft_response || '').trim()
    const status = String(body.status || '').trim()
    if (!recordId || !taskId) return json({ error: 'Task identity is missing.' }, 400)
    if (!draft || draft.length > 2000) return json({ error: 'Reply draft must contain 1–2000 characters.' }, 400)
    if (!STATUS.has(status)) return json({ error: 'Invalid task status.' }, 400)

    const updated = await updateRecord(tableId('tasks'), recordId, {
      [FIELD_IDS.tasks.draft_response]: draft,
      [FIELD_IDS.tasks.status]: status,
    })
    const action = String(body.action || `Updated reply draft and set status to ${status}`).trim().slice(0, 1000)
    const log = await createRecord(tableId('activityLogs'), {
      [FIELD_IDS.activityLogs.log_id]: `WEB-${Date.now()}`,
      [FIELD_IDS.activityLogs.task_id]: recordId,
      [FIELD_IDS.activityLogs.action]: `Staff via Netlify: ${action}`,
      [FIELD_IDS.activityLogs.created_at]: new Date().toISOString(),
    })
    return json({ data: { task: updated, log } })
  } catch (reason) {
    return safeError(reason)
  }
}


