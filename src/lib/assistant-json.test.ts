import { describe, expect, it } from 'vitest'
import { parseAssistantJson } from '../../netlify/functions/assistant.mts'

describe('AI assistant response parsing', () => {
  it('accepts a JSON object wrapped in a code fence', () => {
    expect(parseAssistantJson('```json\n{"title":"Leak repair","priority":"High"}\n```'))
      .toEqual({ title: 'Leak repair', priority: 'High' })
  })

  it('accepts explanatory text around a complete object', () => {
    expect(parseAssistantJson('Result:\n{"title":"Late checkout"}\nDone.'))
      .toEqual({ title: 'Late checkout' })
  })

  it('rejects an incomplete object so the request can be retried', () => {
    expect(() => parseAssistantJson('{"title":"Leak repair"'))
      .toThrow('AI response is not a complete JSON object.')
  })
})
