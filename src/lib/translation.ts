import type { DashboardData, Procedure } from './domain'

/**
 * Display-only translation of live Softr data. Softr keeps English as the single source of truth;
 * Chinese text is fetched from the `translate` function and cached in this browser.
 */
const STORAGE_KEY = 'stayops-translations-zh'
const MAX_TEXT = 4000
const REQUEST_ITEMS = 40
const REQUEST_CHARS = 6000
const CONCURRENCY = 4

export type TranslationMap = Record<string, string>

let memory: TranslationMap | null = null

function loadCache(): TranslationMap {
  if (memory) return memory
  memory = {}
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) memory = JSON.parse(saved) as TranslationMap
  } catch { /* ignore a corrupt or unavailable cache */ }
  return memory
}

function saveCache(map: TranslationMap) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch { /* storage full or disabled: keep the in-memory copy only */ }
}

/** Only text with Latin words needs translating; IDs and numbers are left alone. */
export function needsTranslation(text: string) {
  return !!text && text.length <= MAX_TEXT && /[A-Za-z]{2,}/.test(text) && !/^[A-Z0-9][A-Z0-9_\-./]*$/.test(text.trim())
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

async function requestBatch(texts: string[]): Promise<TranslationMap> {
  const response = await fetch('/.netlify/functions/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, target: 'zh' }),
  })
  const body = (await response.json().catch(() => null)) as { data?: { translations?: TranslationMap }; error?: string } | null
  if (!response.ok) throw new Error(body?.error || 'Translation failed.')
  return body?.data?.translations || {}
}

/** Returns a map with a Chinese version for every text, using the cache wherever possible. */
export async function translateToChinese(texts: string[]): Promise<TranslationMap> {
  const cache = loadCache()
  const missing = [...new Set(texts.filter(needsTranslation))].filter((text) => !(text in cache))
  const groups = chunk(missing)
  let failure: unknown = null
  for (let i = 0; i < groups.length; i += CONCURRENCY) {
    const results = await Promise.allSettled(groups.slice(i, i + CONCURRENCY).map(requestBatch))
    for (const result of results) {
      if (result.status === 'fulfilled') Object.assign(cache, result.value)
      else failure = result.reason
    }
  }
  if (missing.length) saveCache(cache)
  if (failure) throw failure instanceof Error ? failure : new Error('Translation failed.')
  return { ...cache }
}

export function cachedTranslations(): TranslationMap {
  return typeof window === 'undefined' ? {} : { ...loadCache() }
}

function procedureTexts(item: Procedure) {
  return [item.title, item.approval_rule, ...item.instructions]
}

/** Every free-text Softr field that a Chinese reader should see translated. */
export function dashboardTexts(data: DashboardData) {
  return [
    ...data.properties.flatMap((item) => [item.name, item.location, item.city, item.province]),
    ...data.users.map((item) => item.role),
    ...data.procedures.flatMap(procedureTexts),
    ...data.tasks.flatMap((item) => [item.title, item.description, item.ai_summary, item.ai_recommendation, item.draft_response, item.assigned_to]),
    ...data.activityLogs.map((item) => item.action),
    ...data.customers.map((item) => item.nationality),
  ].filter(needsTranslation)
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
    customers: data.customers.map((item) => ({ ...item, nationality: t(item.nationality) })),
  }
}
