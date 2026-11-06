import { json, methodNotAllowed, safeError } from './http.mts'
import { listRecords, tableId, TABLE_ENV } from './softr.mts'

export function listHandler(
  key: keyof typeof TABLE_ENV,
  transform: (row: Awaited<ReturnType<typeof listRecords>>[number]) => unknown,
) {
  return async (request: Request) => {
    if (request.method !== 'GET') return methodNotAllowed(['GET'])
    try {
      const rows = await listRecords(tableId(key))
      return json({ data: rows.map(transform) }, 200, 'public, max-age=15, stale-while-revalidate=45')
    } catch (reason) {
      return safeError(reason)
    }
  }
}


