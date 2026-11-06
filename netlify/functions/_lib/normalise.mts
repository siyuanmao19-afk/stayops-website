import type { SoftrRecord } from './softr.mts'

function text(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(', ')
  if (typeof value === 'object') {
    const item = value as Record<string, unknown>
    return text(item.label ?? item.name ?? item.value ?? item.id ?? '')
  }
  return ''
}

function select(value: unknown) {
  return text(value)
}

function taskTypeFromTitle(title: string) {
  const value = title.toLowerCase()
  if (/clean|linen|towel|amenit/.test(value)) return 'Housekeeping'
  if (/repair|maintenance|lock|water|heating|air|hazard/.test(value)) return 'Maintenance'
  if (/review/.test(value)) return 'Review response'
  if (/noise|complaint|refund/.test(value)) return 'Guest issue'
  return 'Guest enquiry'
}

function approval(rule: string) {
  if (/escalate/i.test(rule)) return 'owner'
  if (/owner/i.test(rule)) return 'owner'
  if (/manager|approval/i.test(rule) && !/may act|no approval/i.test(rule)) return 'manager'
  return 'none'
}

function splitInstructions(value: string) {
  return value
    .split(/(?:\r?\n|(?<=[.!?])\s+)/)
    .map((step) => step.trim())
    .filter(Boolean)
}

export function property(row: SoftrRecord) {
  const location = text(row.fields.location)
  const [city = 'Location pending', province = ''] = location.split(',').map((part) => part.trim())
  const rawStatus = select(row.fields.status)
  return {
    record_id: row.id,
    property_id: text(row.fields.property_id),
    name: text(row.fields.property_name),
    city,
    province,
    location,
    status: rawStatus === 'Inactive' ? 'Paused' : rawStatus === 'Active' ? 'Operating' : 'Limited',
  }
}

export function user(row: SoftrRecord) {
  return {
    record_id: row.id,
    user_id: text(row.fields.user_id),
    name: text(row.fields.name),
    email: text(row.fields.email),
    role: select(row.fields.role),
    property_id: text(row.fields.property_id),
  }
}

export function procedure(row: SoftrRecord) {
  const title = text(row.fields.title)
  const rule = select(row.fields.approval_rule)
  return {
    record_id: row.id,
    procedure_id: text(row.fields.procedure_id),
    property_id: text(row.fields.property_id),
    title,
    task_type: taskTypeFromTitle(title),
    instructions: splitInstructions(text(row.fields.instructions)),
    approval_rule: rule,
    approval_level: approval(rule),
  }
}

export function task(row: SoftrRecord) {
  const type = select(row.fields.task_type) || 'Guest enquiry'
  const status = select(row.fields.status) || 'Open'
  return {
    record_id: row.id,
    id: text(row.fields.task_id) || row.id,
    title: text(row.fields.title) || 'Untitled task',
    description: text(row.fields.description),
    property_id: text(row.fields.property_id),
    task_type: type,
    ai_summary: text(row.fields.ai_summary),
    procedure_id: text(row.fields.procedure_id),
    ai_recommendation: text(row.fields.ai_recommendation),
    draft_response: text(row.fields.draft_response),
    assigned_to: text(row.fields.assigned_to) || 'Unassigned',
    status,
    urgent: status === 'Escalated' || /urgent|hazard|leak|smoke|gas/i.test(text(row.fields.description)),
    created_at: row.createdAt,
  }
}

export function activityLog(row: SoftrRecord) {
  const action = text(row.fields.action)
  const actorId = text(row.fields.actor_id)
  const actor = /^AI\b/i.test(action) || /AI task analysis/i.test(action)
    ? 'AI'
    : /^System\b/i.test(action)
      ? 'System'
      : 'Staff'
  return {
    record_id: row.id,
    id: text(row.fields.log_id) || row.id,
    task_id: text(row.fields.task_id),
    actor,
    actor_name: actor === 'AI' ? 'StayOps AI' : actor === 'System' ? 'StayOps' : actorId || 'StayOps staff',
    action: action.replace(/^(AI|System|Staff)(?: via Netlify)?:\s*/i, ''),
    created_at: text(row.fields.created_at) || row.createdAt,
  }
}

export function customer(row: SoftrRecord) {
  const range = row.fields['Month dates staying']
  const rangeObject = typeof range === 'object' && range ? range as Record<string, unknown> : {}
  return {
    record_id: row.id,
    id_number: text(row.fields['ID number']),
    phone_number: text(row.fields['Phone number']),
    room_number: text(row.fields['Room number']),
    property_number: text(row.fields['Property number']),
    nationality: text(row.fields.Nationality),
    stay_start: text(rangeObject.start ?? rangeObject.from ?? ''),
    stay_end: text(rangeObject.end ?? rangeObject.to ?? ''),
    duration_days: Number(row.fields['Duration of stay'] || 0),
  }
}


