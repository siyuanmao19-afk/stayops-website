export type TaskType =
  | 'Guest enquiry'
  | 'Guest issue'
  | 'Maintenance'
  | 'Housekeeping'
  | 'Review response'

export const TASK_TYPES: TaskType[] = [
  'Guest enquiry',
  'Guest issue',
  'Maintenance',
  'Housekeeping',
  'Review response',
]

export type TaskStatus =
  | 'Open'
  | 'In Progress'
  | 'Pending Approval'
  | 'Escalated'
  | 'Draft Ready'
  | 'Resolved'

export const TASK_STATUSES: TaskStatus[] = [
  'Open',
  'In Progress',
  'Pending Approval',
  'Escalated',
  'Draft Ready',
  'Resolved',
]

export type PropertyStatus = 'Operating' | 'Limited' | 'Paused'

export interface Property {
  record_id: string
  property_id: string
  name: string
  city: string
  province: string
  location: string
  status: PropertyStatus
}

export interface User {
  record_id: string
  user_id: string
  name: string
  email: string
  role: string
  property_id: string
}

export interface Procedure {
  record_id: string
  procedure_id: string
  property_id: string
  title: string
  task_type: TaskType
  instructions: string[]
  approval_rule: string
  approval_level: 'none' | 'manager' | 'owner'
}

export interface Task {
  record_id: string
  id: string
  title: string
  description: string
  property_id: string
  task_type: TaskType
  ai_summary: string
  procedure_id: string
  ai_recommendation: string
  draft_response: string
  assigned_to: string
  status: TaskStatus
  urgent: boolean
  created_at: string
}

export type Actor = 'AI' | 'Staff' | 'System'

export interface ActivityLog {
  record_id: string
  id: string
  task_id: string
  actor: Actor
  actor_name: string
  action: string
  created_at: string
}

export interface Customer {
  record_id: string
  id_number: string
  phone_number: string
  room_number: string
  property_number: string
  nationality: string
  stay_start: string
  stay_end: string
  duration_days: number
}

export interface DashboardData {
  properties: Property[]
  users: User[]
  procedures: Procedure[]
  tasks: Task[]
  activityLogs: ActivityLog[]
  customers: Customer[]
  loadedAt: string
}

export interface AssistantResult {
  task_id: string
  task_record_id: string
  task_type: TaskType
  task_type_reason: string
  summary: string
  procedure: Procedure | null
  staff_action: string
  guest_reply: string
  handling_record: string
}

export const EXAMPLE_QUESTIONS = [
  'Guest in Room 203 wants to check out at 14:00 tomorrow. The next booking arrives at 16:00.',
  'The bathroom tap is leaking and water is spreading across the floor.',
  'A guest reports loud conversation from the next room after quiet hours.',
  'A family asks for two extra bath towels and slippers.',
]


