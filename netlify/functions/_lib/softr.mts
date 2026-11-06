const SOFTR_API = 'https://tables-api.softr.io/api/v1'

export const TABLE_ENV = {
  properties: 'SOFTR_PROPERTIES_TABLE_ID',
  users: 'SOFTR_USERS_TABLE_ID',
  procedures: 'SOFTR_PROCEDURES_TABLE_ID',
  tasks: 'SOFTR_TASKS_TABLE_ID',
  activityLogs: 'SOFTR_ACTIVITY_LOGS_TABLE_ID',
  customers: 'SOFTR_CUSTOMERS_TABLE_ID',
} as const

export const FIELD_IDS = {
  properties: { property_id: '6pcmb', property_name: 'PTLJ2', status: 'x2aar', location: 'NZsC5' },
  users: { user_id: 'vYbiG', name: 'XbMSk', email: 'ZEUVC', role: '2vr6r', property_id: 'Dkwov' },
  procedures: { procedure_id: 'tdS2v', property_id: 'Rtt6A', title: 'm2lyG', instructions: 'fFDas', approval_rule: '0LCqf' },
  tasks: {
    task_id: 'bBfQS', property_id: 'XHoL0', assigned_to: '0UjOd', procedure_id: 'YmtKu',
    title: 'lktbb', task_type: 'bCbqd', description: 'EdqQA', draft_response: '6Brfz',
    status: 'hXTGo', ai_summary: 'Gzbs9', ai_recommendation: 'zcwMH',
  },
  activityLogs: { log_id: '5o1O1', task_id: 'yHpoK', actor_id: 'huyyO', action: 'FJUHr', created_at: 'SUA1U' },
  customers: {
    id_number: '1okTB', phone_number: 'mmfZf', room_number: '8rjSq', property_number: 'I3bVM',
    nationality: 'nSJVG', stay_dates: '9zR41', duration: 'SoAzh',
  },
} as const

function env(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw Object.assign(new Error(`Server configuration is missing ${name}.`), { status: 503 })
  return value
}

export function tableId(key: keyof typeof TABLE_ENV) {
  return env(TABLE_ENV[key])
}

export function databaseId() {
  return env('SOFTR_DATABASE_ID')
}

export interface SoftrRecord {
  id: string
  fields: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

async function softr<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${SOFTR_API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Softr-Api-Key': env('SOFTR_TOKEN'),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const status = response.status
    const friendly = status === 401
      ? 'Softr authentication failed. Check SOFTR_TOKEN.'
      : status === 403
        ? 'This Softr token cannot access the requested table.'
        : status === 429
          ? 'Softr is receiving too many requests. Please try again shortly.'
          : status >= 500
            ? 'Softr is temporarily unavailable.'
            : 'Softr rejected the request.'
    throw Object.assign(new Error(friendly), { status })
  }
  return response.json() as Promise<T>
}

export async function listRecords(table: string): Promise<SoftrRecord[]> {
  const rows: SoftrRecord[] = []
  const limit = 200
  for (let offset = 0; ; offset += limit) {
    const query = new URLSearchParams({ limit: String(limit), offset: String(offset), fieldNames: 'true' })
    const payload = await softr<{ data?: SoftrRecord[]; records?: SoftrRecord[]; metadata?: { total?: number } }>(
      `/databases/${databaseId()}/tables/${table}/records?${query}`,
    )
    const page = payload.data ?? payload.records ?? []
    rows.push(...page)
    const total = payload.metadata?.total
    if (page.length < limit || (typeof total === 'number' && rows.length >= total)) break
  }
  return rows
}

export async function getRecord(table: string, recordId: string) {
  const payload = await softr<{ data: SoftrRecord }>(
    `/databases/${databaseId()}/tables/${table}/records/${encodeURIComponent(recordId)}?fieldNames=true`,
  )
  return payload.data
}

export async function createRecord(table: string, fields: Record<string, unknown>) {
  const payload = await softr<{ data: SoftrRecord }>(
    `/databases/${databaseId()}/tables/${table}/records?fieldNames=true`,
    { method: 'POST', body: JSON.stringify({ fields }) },
  )
  return payload.data
}

export async function updateRecord(table: string, recordId: string, fields: Record<string, unknown>) {
  const payload = await softr<{ data: SoftrRecord }>(
    `/databases/${databaseId()}/tables/${table}/records/${encodeURIComponent(recordId)}?fieldNames=true`,
    { method: 'PATCH', body: JSON.stringify({ fields }) },
  )
  return payload.data
}


