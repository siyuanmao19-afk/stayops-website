import { json, methodNotAllowed, safeError } from './_lib/http.mts'
import { translateTexts } from './_lib/translate.mts'
import { requireAuth } from './_lib/auth.mts'

const MAX_TEXTS = 600
const MAX_TEXT_LENGTH = 4000

/** POST { texts: string[], target: 'zh' } → { data: { translations: Record<source, translated> } } */
export default async (request: Request) => {
  if (request.method !== 'POST') return methodNotAllowed(['POST'])
  const unauthorized = await requireAuth()
  if (unauthorized) return unauthorized
  try {
    const body = await request.json() as Record<string, unknown>
    const target = body.target === 'en' ? 'en' : 'zh'
    if (!Array.isArray(body.texts)) return json({ error: 'texts must be a list.' }, 400)
    const texts = body.texts
      .filter((text): text is string => typeof text === 'string')
      .map((text) => text.slice(0, MAX_TEXT_LENGTH))
    if (texts.length > MAX_TEXTS) return json({ error: `Translate at most ${MAX_TEXTS} texts at once.` }, 400)
    const translations = await translateTexts(texts, target)
    return json({ data: { translations } })
  } catch (reason) {
    return safeError(reason)
  }
}

