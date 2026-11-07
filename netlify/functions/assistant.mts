import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { createRecord, FIELD_IDS, listRecords, tableId, updateRecord } from './_lib/softr.mts'
import { procedure, property } from './_lib/normalise.mts'
import { hasHan } from './_lib/translate.mts'
import { requireAuth } from './_lib/auth.mts'

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

function conciseSummary(value: unknown, language: 'zh' | 'en', fallback: string) {
  const plain = String(value ?? fallback).replace(/\*\*/g, '').trim()
  if (language === 'zh') {
    const firstSentence = plain.match(/^.*?[。！？!?](?:\s|$)/)?.[0]?.trim() || plain
    return firstSentence.length > 52 ? `${firstSentence.slice(0, 51).trim()}…` : firstSentence
  }
  const firstSentence = plain.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || plain
  const words = firstSentence.split(/\s+/).filter(Boolean)
  return words.length > 22 ? `${words.slice(0, 22).join(' ')}…` : firstSentence
}

function procedureSteps(value: unknown) {
  const values = Array.isArray(value)
    ? value.map((step) => String(step).trim()).filter(Boolean)
    : String(value || '').split(/\r?\n/).map((step) => step.replace(/^\s*\d+[.)、]\s*/, '').trim()).filter(Boolean)
  return values.length
    ? values.slice(0, 6)
    : [
        'Confirm the guest request, room, timing and current impact.',
        'Take a safe, reversible interim action and record the outcome.',
        'Ask the responsible manager to approve any cost, compensation or major arrangement.',
      ]
}

export default async (request: Request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized
  let taskRecordId = ''
  let displayTaskId = ''
  try {
    const body = await request.json() as Record<string, unknown>
    const propertyId = String(body.property_id || '').trim()
    const question = String(body.question || '').trim()
    const language = body.language === 'zh' ? 'zh' : 'en'
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
        max_tokens: language === 'zh' ? 2200 : 900,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content: `You are the StayOps operations assistant. Return one valid JSON object only with keys: title, task_type, task_type_phrase, summary, procedure_id, generated_procedure_title, generated_procedure_steps, generated_approval_rule, staff_action, guest_reply. task_type must remain one of these exact internal English values: Guest enquiry, Guest issue, Maintenance, Housekeeping, Review response. task_type_phrase is a short, specific English label summarising this request in 2-5 words. Write summary as one very short English sentence containing only the core request, with no background or advice, at most 16 words. Use a supplied procedure_id only when that database procedure clearly addresses this request; otherwise return N/A rather than forcing an unrelated match. When procedure_id is N/A, create a concise English draft procedure in generated_procedure_title, generated_procedure_steps (3-5 actionable string items) and generated_approval_rule. The generated procedure must stay directly on topic, use safe reversible actions, require staff review, and require owner approval for costs, compensation, room moves or policy exceptions. Never promise refunds, compensation, prices, room moves or completion times without approval. staff_action should be 4-6 sentences and guest_reply 3-5 polite sentences. Use **bold** around 1-3 important phrases in explanatory fields except summary. Always write the top-level text in English because the database is kept in English. Also include guest_request_en: a faithful English translation of the guest request (copy it unchanged if it is already English).${language === 'zh' ? ' The staff member reads Simplified Chinese, so also include key zh with title, task_type_phrase, summary, staff_action and guest_reply translated faithfully into natural Simplified Chinese. task_type_phrase must be 2-6 Chinese characters and summary at most 30 Chinese characters.' : ''}`,
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
    const matched = available.find(({ item }) => item.procedure_id.toLowerCase() === requestedProcedure.toLowerCase())
    const generatedProcedure = matched ? null : {
      record_id: '',
      procedure_id: 'AI DRAFT',
      property_id: propertyId,
      title: bounded(result.generated_procedure_title, 160, 'AI-generated procedure draft'),
      task_type: taskType,
      instructions: procedureSteps(result.generated_procedure_steps),
      approval_rule: bounded(result.generated_approval_rule, 500, 'Staff review is required before use; costs, compensation, room moves and policy exceptions require owner approval.'),
      approval_level: 'owner' as const,
    }
    const rule = matched?.item.approval_rule || generatedProcedure?.approval_rule || 'Owner approval required'
    const status = /escalate immediately/i.test(rule)
      ? 'Escalated'
      : /owner approval/i.test(rule)
        ? 'Pending Approval'
        : 'Draft Ready'
    const summary = conciseSummary(result.summary, 'en', hasHan(question) ? String(result.guest_request_en || question) : question)
    const staffAction = bounded(result.staff_action, 3000, 'No verified procedure match. Ask the duty owner to review the request.')
    const guestReply = bounded(result.guest_reply, 2000, 'Thank you for contacting us. Our team is reviewing your request and will update you shortly.')
    const title = bounded(result.title, 160, 'Guest service request')
    const taskTypePhrase = bounded(result.task_type_phrase, 80, taskType)
    const englishRequest = hasHan(question) ? bounded(result.guest_request_en, 1200, '') : ''
    const zh = (language === 'zh' && typeof result.zh === 'object' && result.zh ? result.zh : {}) as Record<string, unknown>
    // Chinese is returned for display only; Softr receives the English fields above.
    const chinese = language === 'zh' && zh.staff_action && zh.guest_reply
      ? {
          title: bounded(zh.title, 160, title),
          task_type_phrase: bounded(zh.task_type_phrase, 80, taskTypePhrase),
          summary: conciseSummary(zh.summary, 'zh', summary),
          staff_action: bounded(zh.staff_action, 3000, staffAction),
          guest_reply: bounded(zh.guest_reply, 2000, guestReply),
        }
      : null

    await updateRecord(tableId('tasks'), taskRecordId, {
      [FIELD_IDS.tasks.title]: title,
      ...(englishRequest ? { [FIELD_IDS.tasks.description]: englishRequest } : {}),
      [FIELD_IDS.tasks.task_type]: taskType,
      [FIELD_IDS.tasks.procedure_id]: matched?.row.id || '',
      [FIELD_IDS.tasks.ai_summary]: taskTypePhrase,
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
      title,
      task_type_phrase: taskTypePhrase,
      summary,
      procedure: matched?.item || generatedProcedure,
      staff_action: staffAction,
      guest_reply: guestReply,
      zh: chinese,
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





