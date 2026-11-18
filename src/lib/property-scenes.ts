import type { Property } from './domain'

type Scene = { src: string; altEn: string; altZh: string }

const SCENES = {
  hangzhou: { src: '/property-images/hangzhou.webp', altEn: 'Pavilion beside West Lake in Hangzhou', altZh: '杭州西湖边的亭桥' },
  wuzhen: { src: '/property-images/wuzhen.webp', altEn: 'Canal and waterside houses in Wuzhen', altZh: '乌镇河道与临水建筑' },
  suzhou: { src: '/property-images/suzhou.webp', altEn: 'Traditional garden in Suzhou', altZh: '苏州传统园林' },
  nanjing: { src: '/property-images/nanjing.webp', altEn: 'Tree-lined path in Nanjing', altZh: '南京梧桐林荫道' },
  dali: { src: '/property-images/dali.webp', altEn: 'Town beside Erhai Lake in Dali', altZh: '大理洱海边的城镇' },
  lijiang: { src: '/property-images/lijiang.webp', altEn: 'Traditional rooftops in Lijiang Old Town', altZh: '丽江古城的传统屋顶' },
  xiamen: { src: '/property-images/xiamen.webp', altEn: 'Coastline near Gulangyu in Xiamen', altZh: '厦门鼓浪屿附近的海岸' },
  quanzhou: { src: '/property-images/quanzhou.webp', altEn: 'Old brick doorway in Quanzhou', altZh: '泉州古老砖墙与门廊' },
} satisfies Record<string, Scene>

type SceneKey = keyof typeof SCENES

const PROPERTY_SCENE_KEYS: Record<string, SceneKey> = {
  'P-HZ-01': 'hangzhou',
  'P-WZ-01': 'wuzhen',
  'P-SZ-01': 'suzhou',
  'P-NJ-01': 'nanjing',
  'P-DL-01': 'dali',
  'P-LJ-01': 'lijiang',
  'P-XM-01': 'xiamen',
  'P-QZ-01': 'quanzhou',
}

const CITY_SCENE_KEYS: [RegExp, SceneKey][] = [
  [/hangzhou|杭州/i, 'hangzhou'],
  [/wuzhen|乌镇/i, 'wuzhen'],
  [/suzhou|苏州/i, 'suzhou'],
  [/nanjing|南京/i, 'nanjing'],
  [/dali|大理/i, 'dali'],
  [/lijiang|丽江/i, 'lijiang'],
  [/xiamen|厦门|gulangyu|鼓浪屿/i, 'xiamen'],
  [/quanzhou|泉州/i, 'quanzhou'],
]

export function propertyScene(property: Pick<Property, 'property_id' | 'city' | 'location'>): Scene | null {
  const key = PROPERTY_SCENE_KEYS[property.property_id]
    ?? CITY_SCENE_KEYS.find(([pattern]) => pattern.test(`${property.city} ${property.location}`))?.[1]
  return key ? SCENES[key] : null
}
