/** Country names in a language used in that country, independent of the UI language. */
const COUNTRIES = [
  { region: 'CN', locale: 'zh-CN', aliases: ['China', 'Chinese', 'PRC', '中国', '中国人', '中华人民共和国'] },
  { region: 'GB', locale: 'en-GB', aliases: ['UK', 'Britain', 'Great Britain', 'England', 'British', 'English', '英国', '英国人'] },
  { region: 'JP', locale: 'ja-JP', aliases: ['Japan', 'Japanese', '日本', '日本人'] },
  { region: 'US', locale: 'en-US', aliases: ['USA', 'United States', 'United States of America', 'American', '美国', '美国人'] },
  { region: 'KR', locale: 'ko-KR', aliases: ['South Korea', 'Republic of Korea', 'Korean', '韩国', '韩国人'] },
  { region: 'DE', locale: 'de-DE', aliases: ['Germany', 'German', '德国', '德国人'] },
  { region: 'FR', locale: 'fr-FR', aliases: ['France', 'French', '法国', '法国人'] },
  { region: 'IT', locale: 'it-IT', aliases: ['Italy', 'Italian', '意大利', '意大利人'] },
  { region: 'ES', locale: 'es-ES', aliases: ['Spain', 'Spanish', '西班牙', '西班牙人'] },
  { region: 'PT', locale: 'pt-PT', aliases: ['Portugal', 'Portuguese', '葡萄牙', '葡萄牙人'] },
  { region: 'NL', locale: 'nl-NL', aliases: ['Netherlands', 'Holland', 'Dutch', '荷兰', '荷兰人'] },
  { region: 'RU', locale: 'ru-RU', aliases: ['Russia', 'Russian', '俄罗斯', '俄罗斯人'] },
  { region: 'TH', locale: 'th-TH', aliases: ['Thailand', 'Thai', '泰国', '泰国人'] },
  { region: 'VN', locale: 'vi-VN', aliases: ['Vietnam', 'Vietnamese', '越南', '越南人'] },
  { region: 'ID', locale: 'id-ID', aliases: ['Indonesia', 'Indonesian', '印尼', '印度尼西亚', '印尼人'] },
  { region: 'MY', locale: 'ms-MY', aliases: ['Malaysia', 'Malaysian', '马来西亚', '马来西亚人'] },
  { region: 'SG', locale: 'en-SG', aliases: ['Singapore', 'Singaporean', '新加坡', '新加坡人'] },
  { region: 'IN', locale: 'hi-IN', aliases: ['India', 'Indian', '印度', '印度人'] },
  { region: 'AU', locale: 'en-AU', aliases: ['Australia', 'Australian', '澳大利亚', '澳洲', '澳大利亚人'] },
  { region: 'NZ', locale: 'en-NZ', aliases: ['New Zealand', 'New Zealander', '新西兰', '新西兰人'] },
  { region: 'CA', locale: 'en-CA', aliases: ['Canada', 'Canadian', '加拿大', '加拿大人'] },
  { region: 'BR', locale: 'pt-BR', aliases: ['Brazil', 'Brazilian', '巴西', '巴西人'] },
  { region: 'MX', locale: 'es-MX', aliases: ['Mexico', 'Mexican', '墨西哥', '墨西哥人'] },
  { region: 'TR', locale: 'tr-TR', aliases: ['Turkey', 'Türkiye', 'Turkish', '土耳其', '土耳其人'] },
  { region: 'AE', locale: 'ar-AE', aliases: ['UAE', 'United Arab Emirates', 'Emirati', '阿联酋', '阿联酋人'] },
  { region: 'SA', locale: 'ar-SA', aliases: ['Saudi Arabia', 'Saudi', '沙特阿拉伯', '沙特'] },
  { region: 'PH', locale: 'fil-PH', aliases: ['Philippines', 'Filipino', 'Filipina', '菲律宾', '菲律宾人'] },
  { region: 'TW', locale: 'zh-TW', aliases: ['Taiwan', 'Taiwanese', '台湾', '台湾人'] },
  { region: 'HK', locale: 'zh-HK', aliases: ['Hong Kong', 'Hongkonger', '香港', '香港人'] },
  { region: 'MO', locale: 'zh-MO', aliases: ['Macao', 'Macau', '澳门', '澳门人'] },
] as const

function normalize(value: string) {
  return value.normalize('NFKC').trim().toLowerCase()
    .replace(/^(?:nationality\s*[:：]\s*|citizen of\s+|from\s+|来自)/i, '')
    .replace(/[.,()/_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

type Country = { region: string; locale: string }
const byAlias = new Map<string, Country>()
for (const country of COUNTRIES) {
  byAlias.set(normalize(country.region), country)
  for (const alias of country.aliases) byAlias.set(normalize(alias), country)
}

// Cover country names beyond the common demonyms above. Intl supplies the
// country's likely language and the standard region names; unfamiliar values
// still fall back to the original record instead of being guessed.
const sourceNames = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko'].map(
  (locale) => new Intl.DisplayNames([locale], { type: 'region' }),
)
for (let first = 65; first <= 90; first += 1) {
  for (let second = 65; second <= 90; second += 1) {
    const region = String.fromCharCode(first, second)
    if (sourceNames[0].of(region) === region) continue
    const country: Country = { region, locale: new Intl.Locale('und-' + region).maximize().toString() }
    byAlias.set(normalize(region), byAlias.get(normalize(region)) || country)
    for (const names of sourceNames) {
      const name = names.of(region)
      if (name) byAlias.set(normalize(name), byAlias.get(normalize(name)) || country)
    }
  }
}

/** Unknown values stay as recorded, so a guessed country never distorts the counts. */
export function localNationality(value: string) {
  const raw = value.trim()
  if (!raw) return 'Not recorded'
  const country = byAlias.get(normalize(raw))
  if (!country) return raw
  return new Intl.DisplayNames([country.locale], { type: 'region' }).of(country.region) || raw
}
