import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { createRecord, FIELD_IDS, listRecords, tableId, updateRecord } from './_lib/softr.mts'
import { procedure, property } from './_lib/normalise.mts'
import { hasHan } from './_lib/translate.mts'

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

const MATCH_TERMS: Record<string, RegExp> = {
  'Guest enquiry': /check[ -]?in|check[ -]?out|arrival|departure|booking|luggage|extend|late|入住|退房|抵达|离店|预订|行李|延迟/i,
  'Guest issue': /noise|complaint|refund|disturb|quiet|conflict|neighbou?r|噪音|吵|投诉|退款|安静|隔壁|冲突/i,
  Maintenance: /leak|water|tap|faucet|pipe|broken|repair|electric|air.?con|heating|lock|damage|漏水|水龙头|管道|维修|损坏|空调|暖气|门锁|电/i,
  Housekeeping: /clean|towel|linen|slipper|amenit|rubbish|trash|清洁|毛巾|床单|拖鞋|用品|垃圾|卫生/i,
  'Review response': /review|rating|comment|feedback|评价|评分|评论|反馈/i,
}

function procedureScore(
  candidate: { item: ReturnType<typeof procedure> },
  taskType: string,
  requestText: string,
) {
  const procedureText = `${candidate.item.title} ${candidate.item.instructions.join(' ')}`.toLowerCase()
  let score = candidate.item.task_type === taskType ? 100 : 0
  const taskTerms = MATCH_TERMS[taskType]
  if (taskTerms?.test(procedureText)) score += 25

  const requestTokens = new Set(requestText.toLowerCase().match(/[a-z0-9]{3,}|[\p{Script=Han}]{2,}/gu) || [])
  const procedureTokens = new Set(procedureText.match(/[a-z0-9]{3,}|[\p{Script=Han}]{2,}/gu) || [])
  for (const token of requestTokens) if (procedureTokens.has(token)) score += 4
  return score
}

export default async (request: Request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])
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
    const allProcedures = procedureRows
      .map((row) => ({ row, item: procedure(row) }))
    const available = allProcedures
      .filter(({ item }) => item.property_id === propertyId)
    const candidates = available.length ? available : allProcedures

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

    const procedureContext = candidates.length
      ? candidates.map(({ item }) => ({
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
            content: `You are the StayOps operations assistant. Return one valid JSON object only with keys: title, task_type, task_type_reason, summary, procedure_id, staff_action, guest_reply. task_type must remain one of these exact English values: Guest enquiry, Guest issue, Maintenance, Housekeeping, Review response. Write task_type_reason as a natural first-person account from the guest's point of view: 2-3 detailed sentences, about 50-100 Chinese characters or 35-60 English words, explaining what I experienced, how it affected me and what I need. Write summary as one very short sentence containing only the core request: no background and no advice, at most 30 Chinese characters or 16 English words. procedure_id must be the closest relevant supplied ID; choose one whenever allowed_procedures is not empty, and use N/A only when the list is empty. Never invent a procedure. Never promise refunds, compensation, prices, room moves or completion times without approval. staff_action should be 4-6 sentences and guest_reply 3-5 polite sentences. Use **bold** around 1-3 important phrases in explanatory fields except summary. Always write title, task_type_reason, summary, staff_action and guest_reply in English, because the database is kept in English. Also include guest_request_en: a faithful English translation of the guest request (copy it unchanged if it is already English).${language === 'zh' ? ' The staff member reads Simplified Chinese, so also include key zh: an object with the same five keys (title, task_type_reason, summary, staff_action, guest_reply) translated faithfully into natural Simplified Chinese, with the same **bold** phrases and the same length limits (summary at most 30 Chinese characters).' : ''}`,
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
    const exactMatch = candidates.find(({ item }) => item.procedure_id.toLowerCase() === requestedProcedure.toLowerCase())
    const requestText = `${question} ${String(result.title || '')} ${String(result.summary || '')}`
    const closestMatch = [...candidates].sort(
      (left, right) => procedureScore(right, taskType, requestText) - procedureScore(left, taskType, requestText),
    )[0]
    const matched = exactMatch || closestMatch
    const rule = matched?.item.approval_rule || 'Owner approval required (no matching procedure)'
    const status = /escalate immediately/i.test(rule)
      ? 'Escalated'
      : /owner approval/i.test(rule)
        ? 'Pending Approval'
        : 'Draft Ready'
    const summary = conciseSummary(result.summary, 'en', hasHan(question) ? String(result.guest_request_en || question) : question)
    const staffAction = bounded(result.staff_action, 3000, 'No verified procedure match. Ask the duty owner to review the request.')
    const guestReply = bounded(result.guest_reply, 2000, 'Thank you for contacting us. Our team is reviewing your request and will update you shortly.')
    const title = bounded(result.title, 160, 'Guest service request')
    const taskTypeReason = bounded(result.task_type_reason, 1000, `The request is classified as **${taskType}** based on the guest's message.`)
    const englishRequest = hasHan(question) ? bounded(result.guest_request_en, 1200, '') : ''
    const zh = (language === 'zh' && typeof result.zh === 'object' && result.zh ? result.zh : {}) as Record<string, unknown>
    // Chinese is returned for display only; Softr receives the English fields above.
    const chinese = language === 'zh' && zh.staff_action && zh.guest_reply
      ? {
          title: bounded(zh.title, 160, title),
          task_type_reason: bounded(zh.task_type_reason, 1000, taskTypeReason),
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
      title,
      task_type_reason: taskTypeReason,
      summary,
      procedure: matched?.item || null,
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


