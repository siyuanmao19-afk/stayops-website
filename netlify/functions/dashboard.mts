import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { listRecords, tableId } from './_lib/softr.mts'
import { activityLog, customer, procedure, property } from './_lib/normalise.mts'
import { registeredEmployeeEmails, requireSession, session, uniqueUsersByEmail, visibleTasks } from './_lib/access.mts'

export default async (request: Request) => {
  if (request.method !== 'GET') return methodNotAllowed(['GET'])
  const viewer = await session()
  const unauthorized = requireSession(viewer)
  if (unauthorized) return unauthorized
  try {
    const [properties, users, procedures, tasks, activityLogs, customers] = await Promise.all([
      listRecords(tableId('properties')),
      listRecords(tableId('users')),
      listRecords(tableId('procedures')),
      listRecords(tableId('tasks')),
      listRecords(tableId('activityLogs')),
      listRecords(tableId('customers')),
    ])
    const registered = viewer!.manager ? await registeredEmployeeEmails() : null
    const visible = visibleTasks(viewer!, tasks)
    const visibleIds = new Set(visible.map((item) => item.record_id))
    return json({ data: {
      properties: viewer!.manager ? properties.map(property) : properties.map(property).map(({ property_id, name, city, province }) => ({ property_id, name, city, province, location: '', image_url: '', status: 'Operating', record_id: '' })),
      users: registered ? uniqueUsersByEmail(users).filter((item) => registered.has(item.email.toLowerCase())) : [],
      procedures: procedures.map(procedure),
      tasks: visible,
      activityLogs: activityLogs.map(activityLog).filter((item) => viewer!.manager || visibleIds.has(item.task_record_id)),
      customers: viewer!.manager ? customers.map(customer) : [],
      loadedAt: new Date().toISOString(),
    } })
  } catch (reason) {
    return safeError(reason)
  }
}



