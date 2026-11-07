import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'
import { useStayOpsData } from '@/lib/data-context'
import { dashboardTexts } from '@/lib/translation'

export function DataState({ loading, error, retry }: { loading?: boolean; error?: string; retry?: () => Promise<void> }) {
  const { pick } = useLanguage()
  if (loading) return <div className="flex min-h-64 items-center justify-center rounded-3xl border border-border bg-paper text-stone"><Loader2 className="mr-2 size-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />{pick('Loading StayOps data…', '正在加载 StayOps 数据……')}</div>
  return (
    <div role="alert" className="rounded-3xl border border-terracotta/30 bg-paper p-8 text-center shadow-soft">
      <AlertCircle className="mx-auto size-7 text-terracotta" aria-hidden="true" />
      <p className="mt-3 font-semibold text-walnut">{pick('Live data could not be loaded', '无法加载实时数据')}</p>
      <p className="mt-1 text-sm text-stone">{error}</p>
      {retry && <Button variant="outline" className="mt-5 rounded-full" onClick={() => void retry()}><RefreshCw aria-hidden="true" /> {pick('Retry', '重试')}</Button>}
    </div>
  )
}



/** Shown in Chinese mode while live Softr text is being translated (Softr itself stays English). */
export function TranslationNotice() {
  const { language } = useLanguage()
  const { translating, translationError, raw, ensureTranslated } = useStayOpsData()
  if (language !== 'zh' || (!translating && !translationError)) return null
  return (
    <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-champagne/40 bg-sand/30 px-4 py-2.5 text-sm text-coffee">
      <span className="inline-flex items-center gap-2">
        {translating
          ? <><Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />正在将数据库内容翻译成中文……</>
          : <><AlertCircle className="size-4 text-terracotta" aria-hidden="true" />部分内容暂时无法翻译，正在显示英文原文。</>}
      </span>
      {!translating && raw && (
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => void ensureTranslated(dashboardTexts(raw))}>
          <RefreshCw aria-hidden="true" /> 重试翻译
        </Button>
      )}
    </div>
  )
}
