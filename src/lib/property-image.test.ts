import { describe, expect, it } from 'vitest'
import { property } from '../../netlify/functions/_lib/normalise.mts'
import type { SoftrRecord } from '../../netlify/functions/_lib/softr.mts'

function record(fields: Record<string, unknown>): SoftrRecord {
  return { id: 'rec-1', fields: { property_id: 'P-1', property_name: 'Test Inn', location: 'Hangzhou, Zhejiang', status: 'Active', ...fields }, createdAt: '', updatedAt: '' }
}

describe('property images', () => {
  it('accepts Softr attachment URLs and leaves missing photos clearly empty', () => {
    expect(property(record({ 'Property photo': [{ url: 'https://example.com/inn.jpg' }] })).image_url).toBe('https://example.com/inn.jpg')
    expect(property(record({})).image_url).toBe('')
  })

  it('rejects unsafe image protocols', () => {
    expect(property(record({ image_url: 'javascript:alert(1)' })).image_url).toBe('')
  })
})
