import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { createRecord, FIELD_IDS, listRecords, tableId, updateRecord } from './_lib/softr.mts'
import { procedure, property } from './_lib/normalise.mts'

const TYPES = new Set(['Guest enquiry', 'Guest issue', 'Maintenance', 'Housekeeping', 'Review response'])

function aiEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw Object.assign(new Error(`Server configuration is missing ${name}.`), { status: 503 })
  return value
}

function cleanJson(content: string) {
  return content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
}

function bounded(value: unknown, max: number, fallback = '') {
  const result = String(value ?? fallback).trim()
  return result.slice(0, max)
}

export default async (request: Request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])
  let taskRecordId = ''
  let displayTaskId = ''
  try {
    const body = await request.json() as Record<string, unknown>
    const propertyId = String(body.property_id || '').trim()
    const question = String(body.question || '').trim()
    if (!propertyId) return json({ error: 'Choose a property.' }, 400)
    if (question.length < 8 || question.length > 1200) {
      return json({ error: 'Guest request must contain 8–1200 characters.' }, 400)
    }

    const [propertyRows, procedureRows] = await Promise.all([
      listRecords(tableId('properties')),
      listRecords(tableId('procedures')),
    ])
    const selectedRow = propertyRows.find((row) => property(row).property_id === propertyId)
    if (!selectedRow) return json({ error: 'The selected property no longer exists.' }, 404)
    const selectedProperty = property(selectedRow)
    const available = procedureRows
      .map((row) => ({ row, item: procedure(row) }))
      .filter(({ item }) => item.property_id === propertyId)

    displayTaskId = `AI-${Date.now().toString().slice(-10)}`
    const initial = await createRecord(tableId('tasks'), {
      [FIELD_IDS.tasks.task_id]: displayTaskId,
      [FIELD_IDS.tasks.property_id]: selectedRow.id,
      [FIELD_IDS.tasks.title]: 'Guest request awaiting AI analysis',
      [FIELD_IDS.tasks.task_type]: 'Guest enquiry',
      [FIELD_IDS.tasks.description]: question,
      [FIELD_IDS.tasks.status]: 'Open',
    })
    taskRecordId = initial.id

    const procedureContext = available.length
      ? available.map(({ item }) => ({
          procedure_id: item.procedure_id,
          title: item.title,
          instructions: item.instructions,
          approval_rule: item.approval_rule,
        }))
      : []

    const base = aiEnv('DEEPSEEK_BASE_URL').replace(/\/$/, '')
    const key = aiEnv('DEEPSEEK_KEY')
    const aiResponse = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        'api-key': key,
      },
      body: JSON.stringify({
        model: aiEnv('DEEPSEEK_MODEL'),
        max_tokens: 900,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `You are the StayOps operations assistant. Return one valid JSON object only with keys: title, task_type, task_type_reason, summary, procedure_id, staff_action, guest_reply. task_type must be one of: Guest enquiry, Guest issue, Maintenance, Housekeeping, Review response. procedure_id must be one supplied ID or N/A. Never invent a procedure. Never promise refunds, compensation, prices, room moves or completion times without approval. summary should be 2-3 sentences, staff_action 4-6 sentences, guest_reply 3-5 polite sentences. Use **bold** around 1-3 important phrases in explanatory fields.`,
          },
          {
            role: 'user',
            content: JSON.stringify({ property: selectedProperty, guest_request: question, allowed_procedures: procedureContext }),
          },
        ],
      }),
    })
    if (!aiResponse.ok) {
      throw Object.assign(new Error('DeepSeek could not analyse this request. The task was kept as Open.'), { status: 502 })
    }
    const aiPayload = await aiResponse.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = aiPayload.choices?.[0]?.message?.content
    if (!content) throw Object.assign(new Error('DeepSeek returned an empty answer. The task was kept as Open.'), { status: 502 })
    const result = JSON.parse(cleanJson(content)) as Record<string, unknown>

    const taskType = TYPES.has(String(result.task_type)) ? String(result.task_type) : 'Guest enquiry'
    const requestedProcedure = String(result.procedure_id || '').trim()
    const matched = available.find(({ item }) => item.procedure_id === requestedProcedure)
    const rule = matched?.item.approval_rule || 'Owner approval required (no matching procedure)'
    const status = /escalate immediately/i.test(rule)
      ? 'Escalated'
      : /owner approval/i.test(rule)
        ? 'Pending Approval'
        : 'Draft Ready'
    const summary = bounded(result.summary, 2000, question)
    const staffAction = bounded(result.staff_action, 3000, 'No verified procedure match. Ask the duty owner to review the request.')
    const guestReply = bounded(result.guest_reply, 2000, 'Thank you for contacting us. Our team is reviewing your request and will update you shortly.')
    const title = bounded(result.title, 160, 'Guest service request')

    await updateRecord(tableId('tasks'), taskRecordId, {
      [FIELD_IDS.tasks.title]: title,
      [FIELD_IDS.tasks.task_type]: taskType,
      [FIELD_IDS.tasks.procedure_id]: matched?.row.id || '',
      [FIELD_IDS.tasks.ai_summary]: summary,
      [FIELD_IDS.tasks.ai_recommendation]: staffAction,
      [FIELD_IDS.tasks.draft_response]: guestReply,
      [FIELD_IDS.tasks.status]: status,
    })
    await createRecord(tableId('activityLogs'), {
      [FIELD_IDS.activityLogs.log_id]: `AI-${Date.now()}`,
      [FIELD_IDS.activityLogs.task_id]: taskRecordId,
      [FIELD_IDS.activityLogs.action]: `AI task analysis created for staff review.\nType: ${taskType}\nMatched procedure: ${matched?.item.procedure_id || 'None; owner review required'}\nRecommended status: ${status}`,
      [FIELD_IDS.activityLogs.created_at]: new Date().toISOString(),
    })

    return json({ data: {
      task_id: displayTaskId,
      task_record_id: taskRecordId,
      task_type: taskType,
      task_type_reason: bounded(result.task_type_reason, 1000, `The request is classified as **${taskType}** based on the guest's message.`),
      summary,
      procedure: matched?.item || null,
      staff_action: staffAction,
      guest_reply: guestReply,
      handling_record: 'This analysis was saved to **Activity Logs** and linked to the task. Staff edits and the final status are recorded as separate entries, preserving a complete **audit trail**.',
    } })
  } catch (reason) {
    if (taskRecordId) {
      try {
        await createRecord(tableId('activityLogs'), {
          [FIELD_IDS.activityLogs.log_id]: `SYS-${Date.now()}`,
          [FIELD_IDS.activityLogs.task_id]: taskRecordId,
          [FIELD_IDS.activityLogs.action]: 'System: AI analysis failed; task retained as Open for manual handling',
          [FIELD_IDS.activityLogs.created_at]: new Date().toISOString(),
        })
      } catch { /* preserve the original failure */ }
    }
    return safeError(reason)
  }
}


