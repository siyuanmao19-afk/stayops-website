import { json, methodNotAllowed, safeError } from './http.mts'
import { listRecords, tableId, TABLE_ENV } from './softr.mts'
import { requireSession, session, visibleTasks } from './access.mts'

export function listHandler(
  key: keyof typeof TABLE_ENV,
  transform: (row: Awaited<ReturnType<typeof listRecords>>[number]) => unknown,
) {
  return async (request: Request) => {
    if (request.method !== 'GET') return methodNotAllowed(['GET'])
    const viewer = await session()
    const unauthorized = requireSession(viewer)
    if (unauthorized) return unauthorized
    if (!viewer!.manager && ['properties', 'users', 'customers'].includes(key)) return json({ error: 'Manager access is required.' }, 403)
    try {
      const rows = await listRecords(tableId(key))
      if (key === 'tasks') return json({ data: visibleTasks(viewer!, rows) })
      if (key === 'activityLogs' && !viewer!.manager) {
        const taskRows = await listRecords(tableId('tasks'))
        const ids = new Set(visibleTasks(viewer!, taskRows).map((item) => item.record_id))
        return json({ data: rows.map(transform).filter((item) => ids.has((item as { task_record_id: string }).task_record_id)) })
      }
      return json({ data: rows.map(transform) })
    } catch (reason) {
      return safeError(reason)
    }
  }
}



