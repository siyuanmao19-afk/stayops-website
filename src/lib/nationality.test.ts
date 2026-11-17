import { describe, expect, it } from 'vitest'
import { localNationality } from './nationality'

describe('localNationality', () => {
  it('uses a local language for country names regardless of UI language', () => {
    expect(localNationality('Chinese')).toBe('中国')
    expect(localNationality('from Japan')).toBe('日本')
    expect(localNationality('British')).toBe('United Kingdom')
    expect(localNationality('Egypt')).toBe('مصر')
  })

  it('combines country and demonym variants and leaves unknown values intact', () => {
    expect(localNationality('China')).toBe(localNationality('中国人'))
    expect(localNationality('JP')).toBe(localNationality('Japanese'))
    expect(localNationality('Atlantis')).toBe('Atlantis')
    expect(localNationality('')).toBe('Not recorded')
  })
})
