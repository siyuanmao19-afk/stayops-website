import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getDashboard } from './api'
import type { DashboardData, Property, Task } from './domain'
import { translateValue, useLanguage } from './language'
import {
  cachedTranslations,
  dashboardTexts,
  translateDashboard,
  translateForDisplay,
  type TranslationMap,
} from './translation'

type DataState = {
  /** Data in the reader's language, including legacy records stored in Chinese. */
  data: DashboardData | null
  /** Original data exactly as stored in Softr (use for anything written back). */
  raw: DashboardData | null
  loading: boolean
  error: string | null
  /** True while display translations of Softr text are being fetched. */
  translating: boolean
  translationError: string | null
  refresh: () => Promise<void>
  updateTaskLocal: (recordId: string, patch: Partial<Pick<Task, 'draft_response' | 'status'>>) => void
  propertyById: (id: string) => Property | undefined
  /** Translate one piece of Softr text for display (falls back to the original). */
  tx: (text: string) => string
  /** Make sure display translations exist for extra texts (e.g. an assistant result). */
  ensureTranslated: (texts: string[]) => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()
  const [raw, setRaw] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [translations, setTranslations] = useState<Record<'zh' | 'en', TranslationMap>>(() => ({
    zh: cachedTranslations('zh'),
    en: cachedTranslations('en'),
  }))
  const [translating, setTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)
  const translationRun = useRef(0)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRaw(await getDashboard())
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load StayOps data.')
    } finally {
      setLoading(false)
    }
  }, [])

  const updateTaskLocal = useCallback((recordId: string, patch: Partial<Pick<Task, 'draft_response' | 'status'>>) => {
    setRaw((current) => current
      ? {
          ...current,
          tasks: current.tasks.map((task) => {
            if (task.record_id !== recordId) return task
            const status = patch.status ?? task.status
            return {
              ...task,
              ...patch,
              urgent: status === 'Escalated' || /urgent|hazard|leak|smoke|gas/i.test(task.description),
            }
          }),
        }
      : current)
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const ensureTranslated = useCallback(async (texts: string[]) => {
    if (texts.length === 0) {
      translationRun.current += 1
      setTranslating(false)
      setTranslationError(null)
      return
    }
    const target = language
    const run = ++translationRun.current
    setTranslating(true)
    setTranslationError(null)
    try {
      const translated = await translateForDisplay(texts, target)
      setTranslations((current) => ({ ...current, [target]: translated }))
    } catch (reason) {
      setTranslations((current) => ({ ...current, [target]: cachedTranslations(target) }))
      if (run === translationRun.current) setTranslationError(reason instanceof Error ? reason.message : 'Translation failed.')
    } finally {
      if (run === translationRun.current) setTranslating(false)
    }
  }, [language])

  useEffect(() => {
    if (raw) void ensureTranslated(dashboardTexts(raw, language))
  }, [raw, language, ensureTranslated])

  const value = useMemo<DataState>(() => {
    const tx = (text: string) => {
      if (!text) return text
      return translations[language][text] ?? translateValue(text, language)
    }
    const data = raw ? translateDashboard(raw, tx) : null
    return {
      data,
      raw,
      loading,
      error,
      translating,
      translationError,
      refresh,
      updateTaskLocal,
      propertyById: (id) => data?.properties.find((property) => property.property_id === id),
      tx,
      ensureTranslated,
    }
  }, [raw, language, translations, loading, error, translating, translationError, refresh, updateTaskLocal, ensureTranslated])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useStayOpsData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useStayOpsData must be used inside DataProvider')
  return value
}


