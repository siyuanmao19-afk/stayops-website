import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { getRecord, tableId } from './_lib/softr.mts'
import { task } from './_lib/normalise.mts'

export default async (request: Request) => {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  const recordId = new URL(request.url).searchParams.get('id')?.trim()
  if (!recordId) return json({ error: 'A task record ID is required.' }, 400)
  try {
    return json({ data: task(await getRecord(tableId('tasks'), recordId)) })
  } catch (reason) {
    return safeError(reason)
  }
}


