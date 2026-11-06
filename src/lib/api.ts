import type { AssistantResult, DashboardData, TaskStatus } from './domain'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  const body = (await response.json().catch(() => null)) as { data?: T; error?: string } | null
  if (!response.ok) throw new ApiError(body?.error || 'The request could not be completed.', response.status)
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


