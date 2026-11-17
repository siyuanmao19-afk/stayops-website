import type { DashboardData, Procedure } from './domain'

/** Display-only translations of live Softr data, cached separately by target language. */
type TargetLanguage = 'zh' | 'en'
const STORAGE_KEY: Record<TargetLanguage, string> = {
  zh: 'stayops-translations-zh',
  en: 'stayops-translations-en',
}
const MAX_TEXT = 4000
const REQUEST_ITEMS = 40
const REQUEST_CHARS = 6000
const CONCURRENCY = 4

export type TranslationMap = Record<string, string>

const memory: Record<TargetLanguage, TranslationMap | null> = { zh: null, en: null }

function loadCache(target: TargetLanguage): TranslationMap {
  if (memory[target]) return memory[target]
  memory[target] = {}
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY[target])
    if (saved) memory[target] = JSON.parse(saved) as TranslationMap
  } catch { /* ignore a corrupt or unavailable cache */ }
  return memory[target]
}

function saveCache(target: TargetLanguage, map: TranslationMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY[target], JSON.stringify(map))
  } catch { /* storage full or disabled: keep the in-memory copy only */ }
}

/** Translate Latin text into Chinese and Han text into English; leave IDs and numbers alone. */
export function needsTranslation(text: string, target: TargetLanguage = 'zh') {
  if (!text || text.length > MAX_TEXT || /^[A-Z0-9][A-Z0-9_\-./]*$/.test(text.trim())) return false
  return target === 'zh' ? /[A-Za-z]{2,}/.test(text) : /\p{Script=Han}/u.test(text)
}

function chunk(texts: string[]) {
  const groups: string[][] = []
  let current: string[] = []
  let size = 0
  for (const text of texts) {
    if (current.length && (current.length >= REQUEST_ITEMS || size + text.length > REQUEST_CHARS)) {
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

async function requestBatch(texts: string[], target: TargetLanguage): Promise<TranslationMap> {
  const response = await fetch('/.netlify/functions/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target }),
  })
  const body = (await response.json().catch(() => null)) as { data?: { translations?: TranslationMap }; error?: string } | null
  if (!response.ok) throw new Error(body?.error || 'Translation failed.')
  return body?.data?.translations || {}
}

/** Returns cached translations for the selected display language. */
export async function translateForDisplay(texts: string[], target: TargetLanguage): Promise<TranslationMap> {
  const cache = loadCache(target)
  const missing = [...new Set(texts.filter((text) => needsTranslation(text, target)))].filter((text) => !(text in cache))
  const groups = chunk(missing)
  let failure: unknown = null
  for (let i = 0; i < groups.length; i += CONCURRENCY) {
    const results = await Promise.allSettled(groups.slice(i, i + CONCURRENCY).map((group) => requestBatch(group, target)))
    for (const result of results) {
      if (result.status === 'fulfilled') Object.assign(cache, result.value)
      else failure = result.reason
    }
  }
  if (missing.length) saveCache(target, cache)
  if (failure) throw failure instanceof Error ? failure : new Error('Translation failed.')
  return { ...cache }
}

export function cachedTranslations(target: TargetLanguage): TranslationMap {
  return typeof window === 'undefined' ? {} : { ...loadCache(target) }
}

function procedureTexts(item: Procedure) {
  return [item.title, item.approval_rule, ...item.instructions]
}

/** Free-text Softr fields that may need display translation. */
export function dashboardTexts(data: DashboardData, target: TargetLanguage = 'zh') {
  return [
    ...data.properties.flatMap((item) => [item.name, item.location, item.city, item.province]),
    ...data.users.map((item) => item.role),
    ...data.procedures.flatMap(procedureTexts),
    ...data.tasks.flatMap((item) => [item.title, item.description, item.ai_summary, item.ai_recommendation, item.draft_response, item.assigned_to]),
    ...data.activityLogs.map((item) => item.action),
  ].filter((text) => needsTranslation(text, target))
}

export function translateProcedure(item: Procedure, t: (text: string) => string): Procedure {
  return { ...item, title: t(item.title), approval_rule: t(item.approval_rule), instructions: item.instructions.map(t) }
}

/** Copy of the dashboard with display text swapped in; IDs, enums and links stay English. */
export function translateDashboard(data: DashboardData, t: (text: string) => string): DashboardData {
  return {
    ...data,
    properties: data.properties.map((item) => ({ ...item, name: t(item.name), location: t(item.location), city: t(item.city), province: t(item.province) })),
    users: data.users.map((item) => ({ ...item, role: t(item.role) })),
    procedures: data.procedures.map((item) => translateProcedure(item, t)),
    tasks: data.tasks.map((item) => ({
      ...item,
      title: t(item.title),
      description: t(item.description),
      ai_summary: t(item.ai_summary),
      ai_recommendation: t(item.ai_recommendation),
      draft_response: t(item.draft_response),
      assigned_to: t(item.assigned_to),
    })),
    activityLogs: data.activityLogs.map((item) => ({ ...item, action: t(item.action) })),
    customers: data.customers,
  }
}

