import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getDashboard } from './api'
import type { DashboardData, Property } from './domain'
import { translateValue, useLanguage } from './language'
import {
  cachedTranslations,
  dashboardTexts,
  translateDashboard,
  translateToChinese,
  type TranslationMap,
} from './translation'

type DataState = {
  /** Data in the reader's language: Chinese display text when 中文 is selected. */
  data: DashboardData | null
  /** Original English data exactly as stored in Softr (use for anything written back). */
  raw: DashboardData | null
  loading: boolean
  error: string | null
  /** True while Chinese versions of new Softr text are being fetched. */
  translating: boolean
  translationError: string | null
  refresh: () => Promise<void>
  propertyById: (id: string) => Property | undefined
  /** Translate one piece of Softr text for display (falls back to the original). */
  tx: (text: string) => string
  /** Make sure Chinese versions exist for extra texts (e.g. an assistant result). */
  ensureTranslated: (texts: string[]) => Promise<void>
}

const DataContext = createContext<DataState | null>(null)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage()
  const [raw, setRaw] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Browser-cached Chinese text (empty during SSR, where no live data is rendered yet).
  const [translations, setTranslations] = useState<TranslationMap>(() => cachedTranslations())
  const [translating, setTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)

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

  useEffect(() => {
    void refresh()
  }, [refresh])

  const ensureTranslated = useCallback(async (texts: string[]) => {
    if (language !== 'zh' || texts.length === 0) return
    setTranslating(true)
    setTranslationError(null)
    try {
      setTranslations(await translateToChinese(texts))
    } catch (reason) {
      setTranslations(cachedTranslations())
      setTranslationError(reason instanceof Error ? reason.message : 'Translation failed.')
    } finally {
      setTranslating(false)
    }
  }, [language])

  useEffect(() => {
    if (raw && language === 'zh') void ensureTranslated(dashboardTexts(raw))
  }, [raw, language, ensureTranslated])

  const value = useMemo<DataState>(() => {
    const tx = (text: string) => {
      if (language !== 'zh' || !text) return text
      return translations[text] ?? translateValue(text, 'zh')
    }
    const data = raw && language === 'zh' ? translateDashboard(raw, tx) : raw
    return {
      data,
      raw,
      loading,
      error,
      translating,
      translationError,
      refresh,
      propertyById: (id) => data?.properties.find((property) => property.property_id === id),
      tx,
      ensureTranslated,
    }
  }, [raw, language, translations, loading, error, translating, translationError, refresh, ensureTranslated])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useStayOpsData() {
  const value = useContext(DataContext)
  if (!value) throw new Error('useStayOpsData must be used inside DataProvider')
  return value
}
