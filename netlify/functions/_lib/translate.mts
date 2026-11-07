import { createHash } from 'node:crypto'
import { getStore } from '@netlify/blobs'

/**
 * Display-only translation of Softr text. Softr always stays in English; the translations are a
 * derived cache (Netlify Blobs) so each English sentence is only sent to the AI model once.
 */
export type TargetLanguage = 'zh' | 'en'

const LANGUAGE_NAME: Record<TargetLanguage, string> = { zh: 'Simplified Chinese', en: 'English' }
const BATCH_CHARS = 6000
const BATCH_ITEMS = 40

function aiEnv(name: string) {
  const value = process.env[name]?.trim()
  if (!value) throw Object.assign(new Error(`Server configuration is missing ${name}.`), { status: 503 })
  return value
}

function cacheKey(text: string, target: TargetLanguage) {
  return `${target}/${createHash('sha256').update(text).digest('hex')}`
}

function store() {
  try {
    return getStore({ name: 'translation-cache', consistency: 'eventual' })
  } catch {
    return null // Blobs unavailable (e.g. plain unit tests): translate without caching.
  }
}

export function hasHan(text: string) {
  return /\p{Script=Han}/u.test(text)
}

/** Nothing to translate: empty, no letters at all, or already in the target script. */
function skip(text: string, target: TargetLanguage) {
  if (!text.trim() || !/\p{L}/u.test(text)) return true
  return target === 'zh' ? !/[A-Za-z]{2,}/.test(text) : !hasHan(text)
}

function cleanJson(content: string) {
  return content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
}

async function callModel(items: string[], target: TargetLanguage): Promise<string[]> {
  const base = aiEnv('DEEPSEEK_BASE_URL').replace(/\/$/, '')
  const key = aiEnv('DEEPSEEK_KEY')
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'api-key': key },
    body: JSON.stringify({
      model: aiEnv('DEEPSEEK_MODEL'),
      temperature: 0,
      max_tokens: 4000,
      messages: [
        {
          role: 'system',
          content: `You translate text for a homestay operations app into natural, professional ${LANGUAGE_NAME[target]}. Return one valid JSON object only: {"items": [...]} with exactly the same number of strings in the same order. Translate every item fully. Keep IDs (e.g. P-HZ-01, PROC-12, AI-123), room numbers, times, dates, numbers, emails, URLs and personal names unchanged. Translate property and place names naturally (use the established Chinese name when one exists). Preserve line breaks and **bold** markers exactly. Do not add explanations.`,
        },
        { role: 'user', content: JSON.stringify({ items }) },
      ],
    }),
  })
  if (!response.ok) throw Object.assign(new Error('Translation service is unavailable right now.'), { status: 502 })
  const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
  const content = payload.choices?.[0]?.message?.content
  if (!content) throw Object.assign(new Error('Translation service returned an empty answer.'), { status: 502 })
  const parsed = JSON.parse(cleanJson(content)) as { items?: unknown }
  if (!Array.isArray(parsed.items) || parsed.items.length !== items.length) {
    throw Object.assign(new Error('Translation service returned an incomplete answer.'), { status: 502 })
  }
  return parsed.items.map((item, index) => typeof item === 'string' && item.trim() ? item : items[index])
}

function batches(texts: string[]) {
  const groups: string[][] = []
  let current: string[] = []
  let size = 0
  for (const text of texts) {
    if (current.length && (current.length >= BATCH_ITEMS || size + text.length > BATCH_CHARS)) {
      groups.push(current)
      current = []
      size = 0
    }
    current.push(text)
    size += text.length
  }
  if (current.length) groups.push(current)
  return groups
}

/** Translate unique strings; returns a map from source text to translated text. */
export async function translateTexts(texts: string[], target: TargetLanguage): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const unique = [...new Set(texts)]
  const pending: string[] = []
  for (const text of unique) {
    if (skip(text, target)) result[text] = text
    else pending.push(text)
  }
  const cache = store()

  const missing: string[] = []
  await Promise.all(pending.map(async (text) => {
    const hit = cache ? await cache.get(cacheKey(text, target), { type: 'text' }).catch(() => null) : null
    if (hit) result[text] = hit
    else missing.push(text)
  }))

  // Translate a few batches at a time to stay within provider rate limits.
  const groups = batches(missing)
  for (let i = 0; i < groups.length; i += 4) {
    await Promise.all(groups.slice(i, i + 4).map(async (group) => {
      const translated = await callModel(group, target)
      await Promise.all(group.map(async (text, index) => {
        result[text] = translated[index]
        if (cache) await cache.set(cacheKey(text, target), translated[index]).catch(() => undefined)
      }))
    }))
  }
  return result
}

/** Translate one piece of staff-entered text to English before it is written to Softr. */
export async function toEnglish(text: string) {
  if (!hasHan(text)) return text
  const map = await translateTexts([text], 'en')
  return map[text] || text
}
