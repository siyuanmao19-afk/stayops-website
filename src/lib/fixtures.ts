/**
 * DEMO FIXTURES — the single source of stubbed data for the StayOps product surface.
 *
 * Every shape below mirrors a Softr Database table (Tasks, Procedures, Activity Logs,
 * Properties). A later milestone replaces these exports with responses from
 * `/.netlify/functions/*`, which read Softr server-side. Until then, every screen that
 * renders this data shows a visible "Demo data" label so nothing here is mistaken for
 * live operating data.
 */

export type TaskType =
  | 'Guest Enquiry'
  | 'Maintenance'
  | 'Housekeeping'
  | 'Safety'
  | 'Booking'

export const TASK_TYPES: TaskType[] = [
  'Guest Enquiry',
  'Maintenance',
  'Housekeeping',
  'Safety',
  'Booking',
]

export type TaskStatus = 'New' | 'In Progress' | 'Awaiting Approval' | 'Done'
export const TASK_STATUSES: TaskStatus[] = [
  'New',
  'In Progress',
  'Awaiting Approval',
  'Done',
]

export type PropertyStatus = 'Operating' | 'Limited' | 'Paused'

export interface Property {
  property_id: string
  name: string
  city: string
  province: string
  status: PropertyStatus
  rooms: number
}

export interface Procedure {
  procedure_id: string
  property_id: string
  title: string
  task_type: TaskType
  instructions: string[]
  approval_rule: string
  approval_level: 'none' | 'manager' | 'owner'
}

export interface Task {
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
  urgent?: boolean
  created_at: string
}

export type Actor = 'AI' | 'Staff' | 'System'

export interface ActivityLog {
  id: string
  task_id: string
  actor: Actor
  actor_name: string
  action: string
  created_at: string
}

export const DEMO_PROPERTIES: Property[] = [
  { property_id: 'P-HZ-01', name: 'West Lake Tea House', city: 'Hangzhou', province: 'Zhejiang', status: 'Operating', rooms: 8 },
  { property_id: 'P-WZ-01', name: 'Canal Lantern Inn', city: 'Wuzhen', province: 'Zhejiang', status: 'Operating', rooms: 6 },
  { property_id: 'P-SZ-01', name: 'Garden Courtyard Suzhou', city: 'Suzhou', province: 'Jiangsu', status: 'Operating', rooms: 10 },
  { property_id: 'P-NJ-01', name: 'Plane Tree Residence', city: 'Nanjing', province: 'Jiangsu', status: 'Limited', rooms: 5 },
  { property_id: 'P-DL-01', name: 'Erhai Stone Lodge', city: 'Dali', province: 'Yunnan', status: 'Operating', rooms: 7 },
  { property_id: 'P-LJ-01', name: 'Old Town Timber House', city: 'Lijiang', province: 'Yunnan', status: 'Paused', rooms: 4 },
  { property_id: 'P-XM-01', name: 'Gulangyu Sea Breeze', city: 'Xiamen', province: 'Fujian', status: 'Operating', rooms: 9 },
  { property_id: 'P-QZ-01', name: 'Red Brick Quanzhou', city: 'Quanzhou', province: 'Fujian', status: 'Operating', rooms: 6 },
]

export const DEMO_PROCEDURES: Procedure[] = [
  {
    procedure_id: 'PROC-HZ-LATE-01',
    property_id: 'P-HZ-01',
    title: 'Late check-out request',
    task_type: 'Booking',
    instructions: [
      'Check the room’s next arrival in the booking calendar.',
      'Offer up to 13:00 free of charge if no same-day arrival.',
      'Anything later than 13:00 requires manager approval before replying.',
      'Inform housekeeping of the new turnover time.',
    ],
    approval_rule: 'Manager approval after 13:00',
    approval_level: 'manager',
  },
  {
    procedure_id: 'PROC-HZ-HVAC-02',
    property_id: 'P-HZ-01',
    title: 'Air-conditioning fault in guest room',
    task_type: 'Maintenance',
    instructions: [
      'Ask the guest for the room number and a convenient time.',
      'Reset the unit from the corridor panel and wait 10 minutes.',
      'If still faulty, call the on-call technician and log the visit.',
      'Offer a room move only if a vacant room of equal type exists.',
    ],
    approval_rule: 'Room moves need duty manager sign-off',
    approval_level: 'manager',
  },
  {
    procedure_id: 'PROC-HZ-SAFE-03',
    property_id: 'P-HZ-01',
    title: 'Gas or smoke smell reported',
    task_type: 'Safety',
    instructions: [
      'Ask the guest to leave the room and avoid switches or flames.',
      'Close the floor gas valve and open windows if safe to do so.',
      'Call the gas utility emergency line and notify the owner.',
      'Do not let anyone re-enter until cleared by the utility.',
    ],
    approval_rule: 'Owner must be notified immediately',
    approval_level: 'owner',
  },
  {
    procedure_id: 'PROC-SZ-HK-01',
    property_id: 'P-SZ-01',
    title: 'Extra towels and amenities',
    task_type: 'Housekeeping',
    instructions: [
      'Confirm the room number and items requested.',
      'Deliver within 20 minutes during staffed hours.',
      'Record the delivery in the housekeeping sheet.',
    ],
    approval_rule: 'No approval required',
    approval_level: 'none',
  },
  {
    procedure_id: 'PROC-DL-ENQ-01',
    property_id: 'P-DL-01',
    title: 'Airport transfer enquiry',
    task_type: 'Guest Enquiry',
    instructions: [
      'Share the partner driver’s fixed transfer fare from the rate card.',
      'Collect flight number and arrival time.',
      'Confirm the booking with the driver and send details to the guest.',
    ],
    approval_rule: 'No approval required',
    approval_level: 'none',
  },
  {
    procedure_id: 'PROC-XM-REF-01',
    property_id: 'P-XM-01',
    title: 'Refund or compensation request',
    task_type: 'Booking',
    instructions: [
      'Acknowledge the request without promising any outcome.',
      'Collect booking reference, dates and the reason in writing.',
      'Escalate to the owner with photos or evidence attached.',
    ],
    approval_rule: 'Owner decides all refunds',
    approval_level: 'owner',
  },
]

export const DEMO_TASKS: Task[] = [
  {
    id: 'T-1042',
    title: 'Guest asks for 15:00 check-out',
    description:
      'Room 3 guest asked via WeChat whether they can stay until 15:00 tomorrow because their train leaves at 17:30.',
    property_id: 'P-HZ-01',
    task_type: 'Booking',
    ai_summary:
      'Guest in **Room 3** requests a **late check-out until 15:00** tomorrow due to an evening train.',
    procedure_id: 'PROC-HZ-LATE-01',
    ai_recommendation:
      'Check the next arrival for Room 3. If none, offer 13:00 free and request **manager approval** for 15:00.',
    draft_response:
      'Thank you for letting us know about your train time. We are checking tomorrow’s room schedule now and will confirm the latest check-out we can offer shortly.',
    assigned_to: 'Lin Mei',
    status: 'Awaiting Approval',
    created_at: '2026-11-06T08:42:00+08:00',
  },
  {
    id: 'T-1041',
    title: 'Air-conditioning not heating in Room 5',
    description:
      'Guest reports the AC blows cold air even on heat mode. Room temperature around 14°C.',
    property_id: 'P-HZ-01',
    task_type: 'Maintenance',
    ai_summary:
      'Heating failure in **Room 5**; room is cold and guest comfort is affected tonight.',
    procedure_id: 'PROC-HZ-HVAC-02',
    ai_recommendation:
      'Reset the unit from the corridor panel. If unresolved after 10 minutes, call the **on-call technician**.',
    draft_response:
      'We are sorry the room is cold. A team member is on the way to reset the heating, and we will keep you updated within the next 15 minutes.',
    assigned_to: 'Zhou Kai',
    status: 'In Progress',
    urgent: true,
    created_at: '2026-11-06T07:55:00+08:00',
  },
  {
    id: 'T-1039',
    title: 'Extra towels for family room',
    description: 'Family of four in Room 2 asks for two extra bath towels and slippers.',
    property_id: 'P-SZ-01',
    task_type: 'Housekeeping',
    ai_summary: 'Family in **Room 2** needs **two bath towels** and slippers.',
    procedure_id: 'PROC-SZ-HK-01',
    ai_recommendation: 'Deliver within 20 minutes and record it in the housekeeping sheet.',
    draft_response:
      'Of course — we will bring two extra bath towels and slippers to Room 2 shortly.',
    assigned_to: 'Chen Yu',
    status: 'Done',
    created_at: '2026-11-05T21:10:00+08:00',
  },
  {
    id: 'T-1037',
    title: 'Transfer from Dali airport',
    description: 'Arriving guest wants a pick-up from Dali airport on Saturday afternoon.',
    property_id: 'P-DL-01',
    task_type: 'Guest Enquiry',
    ai_summary: 'Arriving guest requests an **airport pick-up** on Saturday afternoon.',
    procedure_id: 'PROC-DL-ENQ-01',
    ai_recommendation: 'Share the rate-card fare, collect the **flight number** and confirm with the driver.',
    draft_response:
      'We would be happy to arrange a pick-up. Could you share your flight number and arrival time so we can confirm the driver?',
    assigned_to: 'Unassigned',
    status: 'New',
    created_at: '2026-11-05T18:30:00+08:00',
  },
  {
    id: 'T-1035',
    title: 'Guest requests refund for noisy night',
    description:
      'Guest says street noise kept them awake and asks for a partial refund for the second night.',
    property_id: 'P-XM-01',
    task_type: 'Booking',
    ai_summary: 'Guest reports **street noise** and asks for a **partial refund** of night two.',
    procedure_id: 'PROC-XM-REF-01',
    ai_recommendation:
      'Acknowledge without promising an outcome, collect details in writing and **escalate to the owner**.',
    draft_response:
      'We are sorry your rest was disturbed. We have shared your feedback with the owner, who reviews every request of this kind personally, and we will come back to you with a response.',
    assigned_to: 'Huang Jie',
    status: 'Awaiting Approval',
    created_at: '2026-11-05T11:05:00+08:00',
  },
]

export const DEMO_ACTIVITY_LOGS: ActivityLog[] = [
  { id: 'L-301', task_id: 'T-1042', actor: 'AI', actor_name: 'StayOps AI', action: 'Analysed enquiry and matched PROC-HZ-LATE-01', created_at: '2026-11-06T08:42:30+08:00' },
  { id: 'L-302', task_id: 'T-1042', actor: 'Staff', actor_name: 'Lin Mei', action: 'Edited guest reply draft', created_at: '2026-11-06T08:50:12+08:00' },
  { id: 'L-303', task_id: 'T-1042', actor: 'System', actor_name: 'StayOps', action: 'Status set to Awaiting Approval', created_at: '2026-11-06T08:51:00+08:00' },
  { id: 'L-298', task_id: 'T-1041', actor: 'AI', actor_name: 'StayOps AI', action: 'Flagged as urgent maintenance', created_at: '2026-11-06T07:55:40+08:00' },
  { id: 'L-299', task_id: 'T-1041', actor: 'Staff', actor_name: 'Zhou Kai', action: 'Marked as reviewed and started work', created_at: '2026-11-06T08:02:10+08:00' },
]

/** Location network shown on the homepage graph. Clearly labelled as demo. */
export const DEMO_LOCATION_NETWORK = {
  label: 'Demo location network',
  provinces: [
    { id: 'zhejiang', name: 'Zhejiang', cities: ['Hangzhou', 'Wuzhen'] },
    { id: 'jiangsu', name: 'Jiangsu', cities: ['Suzhou', 'Nanjing'] },
    { id: 'yunnan', name: 'Yunnan', cities: ['Dali', 'Lijiang'] },
    { id: 'fujian', name: 'Fujian', cities: ['Xiamen', 'Quanzhou'] },
  ],
}

export function propertyById(id: string) {
  return DEMO_PROPERTIES.find((p) => p.property_id === id)
}

export function openTasksForCity(city: string) {
  const ids = DEMO_PROPERTIES.filter((p) => p.city === city).map((p) => p.property_id)
  return DEMO_TASKS.filter((t) => ids.includes(t.property_id) && t.status !== 'Done').length
}

// ---------------------------------------------------------------------------
// AI Assistant stub — mirrors the structured JSON the `assistant` function will return.
// ---------------------------------------------------------------------------

export interface AssistantResult {
  task_id: string
  task_type: TaskType
  task_type_reason: string
  summary: string
  procedure: Procedure | null
  staff_action: string
  guest_reply: string
  handling_record: string
}

export const EXAMPLE_QUESTIONS = [
  'Guest in Room 3 wants to check out at 15:00 tomorrow — can we allow it?',
  'The heating in Room 5 is blowing cold air, guest says it’s 14°C.',
  'A guest smells gas near the kitchen on the ground floor.',
  'Guest asks for a partial refund because of street noise.',
]

function detectType(q: string): TaskType {
  const s = q.toLowerCase()
  if (/(gas|smoke|fire|injur|safety|smell)/.test(s)) return 'Safety'
  if (/(check.?out|check.?in|refund|book|reservation|cancel|extend)/.test(s)) return 'Booking'
  if (/(heat|ac|air.?con|leak|broken|repair|wifi|light|water)/.test(s)) return 'Maintenance'
  if (/(towel|clean|linen|slipper|amenit|housekeep)/.test(s)) return 'Housekeeping'
  return 'Guest Enquiry'
}

/** Simulates the assistant pipeline locally. Replaced by POST /.netlify/functions/assistant. */
export async function runDemoAssistant(
  propertyId: string,
  question: string,
): Promise<AssistantResult> {
  await new Promise((r) => setTimeout(r, 1600))
  const type = detectType(question)
  const property = propertyById(propertyId)
  const procedure =
    DEMO_PROCEDURES.find((p) => p.property_id === propertyId && p.task_type === type) ?? null
  const place = property ? property.name : 'the selected property'

  const reasons: Record<TaskType, string> = {
    Safety: 'The message mentions a **potential hazard** to guests or staff, so it is treated as a **Safety** task and handled before anything else.',
    Booking: 'The request concerns **stay dates, timing or payment**, which changes the reservation itself, so it is classified as **Booking**.',
    Maintenance: 'The guest describes **equipment that is not working** as expected in their room, which needs a physical fix — a **Maintenance** task.',
    Housekeeping: 'The guest is asking for **room supplies or cleaning**, which is handled by the housekeeping team.',
    'Guest Enquiry': 'The message is a **general question** that needs information rather than a physical action, so it is a **Guest Enquiry**.',
  }

  return {
    task_id: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
    task_type: type,
    task_type_reason: reasons[type],
    summary: `The guest at **${place}** raised the following: “${question.trim()}”. The key need is a **clear, timely response** that follows house procedure, and staff should confirm the room number and timing before acting.`,
    procedure,
    staff_action: procedure
      ? `First, acknowledge the guest within a few minutes so they know the request is being handled. Then follow **${procedure.procedure_id}** step by step, starting with: ${procedure.instructions[0].toLowerCase()} Record what you find before taking the next step. ${procedure.approval_level === 'none' ? 'This procedure needs no approval, so you can complete it directly.' : `Pause before confirming anything to the guest: **${procedure.approval_rule.toLowerCase()}**.`} Finally, update the task status and note the outcome so the next shift has full context.`
      : 'No verified procedure exists for this case, so do not improvise a policy. Acknowledge the guest and gather the room number, timing and any photos. Share the details with the **duty manager** and ask how to proceed. Note the gap so a procedure can be written for next time.',
    guest_reply:
      type === 'Safety'
        ? 'Thank you for telling us right away — your safety comes first. Please leave the area and avoid using switches or open flames. A member of our team is on the way now, and we will stay in touch with you until everything is confirmed safe.'
        : 'Thank you for reaching out, and we are sorry for any inconvenience. A member of our team is looking into this now. We will come back to you shortly with a clear update on what we can arrange.',
    handling_record:
      'This analysis is saved to **Activity Logs** as an AI entry linked to the task. Any edit a staff member makes to the reply draft is logged separately under their name, and the final action — reviewed, approved or sent — is recorded with a timestamp, creating a complete **audit trail**.',
  }
}
