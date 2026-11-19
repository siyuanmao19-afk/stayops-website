import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { requireSession, session, visibleTasks } from './_lib/access.mts'
import { listRecords, tableId } from './_lib/softr.mts'
import { activityLog } from './_lib/normalise.mts'

export default async (request: Request) => {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  try {
    const viewer = await session()
    const unauthorized = requireSession(viewer)
    if (unauthorized) return unauthorized
    const [taskRows, logRows] = await Promise.all([listRecords(tableId('tasks')), listRecords(tableId('activityLogs'))])
    const tasks = new Map(visibleTasks(viewer!, taskRows).map((item) => [item.record_id, item]))
    const notifications = logRows.map(activityLog)
      .filter((log) => log.action.includes(`assigned task to ${viewer!.email}.`) && tasks.has(log.task_record_id))
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .slice(0, 20)
      .map((log) => ({ id: log.id, task_id: log.task_record_id, title: tasks.get(log.task_record_id)!.title, created_at: log.created_at }))
    return json({ data: notifications })
  } catch (reason) {
    return safeError(reason)
  }
}
