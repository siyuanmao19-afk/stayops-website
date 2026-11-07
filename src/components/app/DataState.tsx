import { AlertCircle, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/lib/language'

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


