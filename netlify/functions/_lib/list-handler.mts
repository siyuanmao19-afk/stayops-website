import { json, methodNotAllowed, safeError } from './http.mts'
import { listRecords, tableId, TABLE_ENV } from './softr.mts'
import { requireAuth } from './auth.mts'

export function listHandler(
  key: keyof typeof TABLE_ENV,
  transform: (row: Awaited<ReturnType<typeof listRecords>>[number]) => unknown,
) {
  return async (request: Request) => {
    if (request.method !== 'GET') return methodNotAllowed(['GET'])
    const unauthorized = await requireAuth()
    if (unauthorized) return unauthorized
    try {
      const rows = await listRecords(tableId(key))
      return json({ data: rows.map(transform) })
    } catch (reason) {
      return safeError(reason)
    }
  }
}



