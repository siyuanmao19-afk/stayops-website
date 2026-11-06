import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { listRecords, tableId } from './_lib/softr.mts'
import { activityLog, customer, procedure, property, task, user } from './_lib/normalise.mts'

export default async (request: Request) => {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  try {
    const [properties, users, procedures, tasks, activityLogs, customers] = await Promise.all([
      listRecords(tableId('properties')),
      listRecords(tableId('users')),
      listRecords(tableId('procedures')),
      listRecords(tableId('tasks')),
      listRecords(tableId('activityLogs')),
      listRecords(tableId('customers')),
    ])
    return json({ data: {
      properties: properties.map(property),
      users: users.map(user),
      procedures: procedures.map(procedure),
      tasks: tasks.map(task),
      activityLogs: activityLogs.map(activityLog),
      customers: customers.map(customer),
      loadedAt: new Date().toISOString(),
    } }, 200, 'public, max-age=10, stale-while-revalidate=30')
  } catch (reason) {
    return safeError(reason)
  }
}


