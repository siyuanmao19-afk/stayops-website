import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Language = 'en' | 'zh'

type LanguageContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  toggleLanguage: () => void
  pick: (english: string, chinese: string) => string
  /** Translate a known data value such as a task type or status. */
  tv: (value: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const ENGLISH_FALLBACK: LanguageContextValue = {
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  pick: (english) => english,
  tv: (value) => value,
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')

  useEffect(() => {
    const saved = window.localStorage.getItem('stayops-language')
    if (saved === 'zh' || saved === 'en') setLanguage(saved)
  }, [])

  useEffect(() => {
    window.localStorage.setItem('stayops-language', language)
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en'
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage((current) => current === 'en' ? 'zh' : 'en'),
    pick: (english, chinese) => language === 'zh' ? chinese : english,
    tv: (value) => translateValue(value, language),
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  // Outside the provider (e.g. isolated tests or a crashed shell) fall back to English.
  return useContext(LanguageContext) ?? ENGLISH_FALLBACK
}



const VALUE_ZH: Record<string, string> = {
  // Task types
  Safety: '安全',
  Maintenance: '维修',
  Housekeeping: '客房服务',
  'Review response': '评价回复',
  'Guest enquiry': '客人咨询',
  'Guest issue': '客诉问题',
  Booking: '预订',
  // Task statuses
  Open: '待处理',
  'In Progress': '处理中',
  'Pending Approval': '等待审批',
  Escalated: '已升级',
  'Draft Ready': '草稿已生成',
  Resolved: '已解决',
  // Property statuses
  Operating: '运营中',
  Limited: '部分运营',
  Paused: '暂停营业',
  // Activity actors
  AI: 'AI',
  Staff: '员工',
  System: '系统',
  // Misc data fallbacks
  'Not recorded': '未记录',
}

/** Translate a known enum-like value (task type, status, actor…); unknown values pass through unchanged. */
export function translateValue(value: string, language: Language) {
  return language === 'zh' ? VALUE_ZH[value] ?? value : value
}
