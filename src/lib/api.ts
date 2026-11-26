import type { AssistantResult, DashboardData, TaskStatus } from './domain'

export class ApiError extends Error {
  status: number
  taskRecordId: string | null
  code: string | null

  constructor(message: string, status: number, taskRecordId: string | null = null, code: string | null = null) {
    super(message)
    this.status = status
    this.taskRecordId = taskRecordId
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = (await response.json().catch(() => null)) as { data?: T; error?: string; code?: string; task_record_id?: string } | null
  if (!response.ok) throw new ApiError(body?.error || 'The request could not be completed.', response.status, body?.task_record_id || null, body?.code || null)
  return body?.data as T
}

export function getDashboard() {
  return request<DashboardData>('dashboard')
}

export function updateTask(input: {
  record_id: string
  task_id: string
  draft_response: string
  status: TaskStatus
  action?: string
}) {
  return request<{ task: unknown; log: unknown }>('task-draft', {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function askAssistant(property_id: string, question: string, language: 'en' | 'zh' = 'en') {
  return request<AssistantResult>('assistant', {
    method: 'POST',
    body: JSON.stringify({ property_id, question, language }),
  })
}

export function assignTask(record_id: string, email: string) {
  return request<{ task: unknown; unchanged: boolean }>('assign-task', {
    method: 'POST',
    body: JSON.stringify({ record_id, email }),
  })
}

export interface AssignmentNotice { id: string; task_id: string; title: string; created_at: string }

export function getNotifications() {
  return request<AssignmentNotice[]>('notifications')
}

export function getPushPublicKey() {
  return request<{ public_key: string }>('push-subscription')
}

export function savePushSubscription(subscription: PushSubscription) {
  return request<{ enabled: boolean }>('push-subscription', {
    method: 'POST',
    body: JSON.stringify(subscription),
  })
}


