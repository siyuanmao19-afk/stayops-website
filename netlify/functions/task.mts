import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { getRecord, tableId } from './_lib/softr.mts'
import { task } from './_lib/normalise.mts'
import { ownsTask, requireSession, session } from './_lib/access.mts'

export default async (request: Request) => {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  const viewer = await session()
  const unauthorized = requireSession(viewer)
  if (unauthorized) return unauthorized
  const recordId = new URL(request.url).searchParams.get('id')?.trim()
  if (!recordId) return json({ error: 'A task record ID is required.' }, 400)
  try {
    const item = task(await getRecord(tableId('tasks'), recordId))
    return ownsTask(viewer!, item.assigned_to, item.assigned_user_record_id) ? json({ data: item }) : json({ error: 'Task not found.' }, 404)
  } catch (reason) {
    return safeError(reason)
  }
}



