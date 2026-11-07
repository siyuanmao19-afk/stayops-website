import { useCallback, useEffect, useRef, useState } from 'react'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { DemoBadge } from '@/components/brand/DemoBadge'
import {
  DEMO_LOCATION_NETWORK,
  DEMO_PROPERTIES,
  openTasksForCity,
  type Property,
} from '@/lib/fixtures'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language'

const W = 900
const H = 560
const CITY_COLORS = ['#71806A', '#E8D4AE', '#A64B3C']

interface GNode {
  id: string
  label: string
  kind: 'province' | 'city'
  parent?: string
  r: number
  color: string
  count: number
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  fixed?: boolean
}

function buildNodes(): GNode[] {
  const nodes: GNode[] = []
  const provinces = DEMO_LOCATION_NETWORK.provinces
  let cityIdx = 0
  provinces.forEach((p, pi) => {
    const angle = (pi / provinces.length) * Math.PI * 2 - Math.PI / 4
    const px = W / 2 + Math.cos(angle) * 220
    const py = H / 2 + Math.sin(angle) * 150
    const count = DEMO_PROPERTIES.filter((pr) => pr.province === p.name).length
    nodes.push({
      id: p.id,
      label: p.name,
      kind: 'province',
      r: 30 + count * 5,
      color: '#C69A52',
      count,
      x: px,
      y: py,
      vx: 0,
      vy: 0,
      phase: pi * 1.7,
    })
    p.cities.forEach((c, ci) => {
      const a = angle + (ci === 0 ? -0.7 : 0.7)
      nodes.push({
        id: `${p.id}:${c}`,
        label: c,
        kind: 'city',
        parent: p.id,
        r: 13,
        color: CITY_COLORS[cityIdx++ % CITY_COLORS.length],
        count: DEMO_PROPERTIES.filter((pr) => pr.city === c).length,
        x: px + Math.cos(a) * 110,
        y: py + Math.sin(a) * 110,
        vx: 0,
        vy: 0,
        phase: cityIdx * 2.3,
      })
    })
  })
  return nodes
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const on = () => setReduced(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduced
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setNarrow(mq.matches)
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

export function LocationGraph() {
  const nodesRef = useRef<GNode[]>(buildNodes())
  const { pick } = useLanguage()
  const [, setTick] = useState(0)
  const [hover, setHover] = useState<string | null>(null)
  const [province, setProvince] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [view, setView] = useState({ k: 1, x: 0, y: 0 })
  const reduced = usePrefersReducedMotion()
  const narrow = useIsNarrow()
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ id: string | null; panStart?: { x: number; y: number; vx: number; vy: number }; moved: boolean }>({ id: null, moved: false })

  const visible = useCallback(
    (n: GNode) => n.kind === 'province' || !narrow || n.parent === province,
    [narrow, province],
  )

  // Physics loop: spring to parent, collision/repulsion, centring, gentle drift.
  useEffect(() => {
    let raf = 0
    let frame = 0
    const step = () => {
      frame++
      const nodes = nodesRef.current
      const t = frame / 60
      for (const n of nodes) {
        if (n.fixed) continue
        // centring
        n.vx += (W / 2 - n.x) * 0.0006
        n.vy += (H / 2 - n.y) * 0.0009
        // drift
        if (!reduced) {
          n.vx += Math.sin(t * 0.6 + n.phase) * 0.012
          n.vy += Math.cos(t * 0.5 + n.phase) * 0.012
        }
        if (n.parent) {
          const p = nodes.find((m) => m.id === n.parent)!
          const dx = n.x - p.x
          const dy = n.y - p.y
          const d = Math.hypot(dx, dy) || 1
          const target = p.r + 70
          const f = (d - target) * 0.01
          n.vx -= (dx / d) * f
          n.vy -= (dy / d) * f
        }
      }
      // collision with label padding
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          if (!visible(a) || !visible(b)) continue
          const dx = b.x - a.x
          const dy = b.y - a.y
          const d = Math.hypot(dx, dy) || 0.01
          const min = a.r + b.r + (a.kind === 'city' || b.kind === 'city' ? 46 : 70)
          if (d < min) {
            const push = ((min - d) / d) * 0.08
            if (!a.fixed) {
              a.vx -= dx * push
              a.vy -= dy * push
            }
            if (!b.fixed) {
              b.vx += dx * push
              b.vy += dy * push
            }
          }
        }
      }
      for (const n of nodes) {
        if (n.fixed) continue
        n.vx *= 0.86
        n.vy *= 0.86
        n.x = Math.max(n.r + 10, Math.min(W - n.r - 10, n.x + n.vx))
        n.y = Math.max(n.r + 10, Math.min(H - n.r - 24, n.y + n.vy))
      }
      setTick(frame)
      // With reduced motion, settle once and stop unless dragging.
      if (!reduced || frame < 240 || drag.current.id) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduced, visible])

  const toLocal = (clientX: number, clientY: number) => {
    const svg = svgRef.current!
    const rect = svg.getBoundingClientRect()
    const sx = ((clientX - rect.left) / rect.width) * W
    const sy = ((clientY - rect.top) / rect.height) * H
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k }
  }

  const zoom = (factor: number) =>
    setView((v) => {
      const k = Math.max(0.7, Math.min(1.8, v.k * factor))
      const cx = W / 2
      const cy = H / 2
      return { k, x: cx - ((cx - v.x) / v.k) * k, y: cy - ((cy - v.y) / v.k) * k }
    })

  const reset = () => {
    setView({ k: 1, x: 0, y: 0 })
    setProvince(null)
    setCity(null)
    nodesRef.current = buildNodes()
  }

  const nodes = nodesRef.current
  const byId = (id: string) => nodes.find((n) => n.id === id)!

  const related = (() => {
    const focus = hover ?? province
    if (!focus) return null
    const set = new Set<string>([focus])
    const n = nodes.find((m) => m.id === focus)
    if (n?.kind === 'province') nodes.filter((m) => m.parent === focus).forEach((m) => set.add(m.id))
    if (n?.parent) set.add(n.parent)
    return set
  })()

  const activate = (n: GNode) => {
    if (n.kind === 'province') {
      setProvince((p) => (p === n.id ? null : n.id))
      setCity(null)
    } else {
      setProvince(n.parent!)
      setCity(n.label)
    }
  }

  const listProperties: Property[] = city
    ? DEMO_PROPERTIES.filter((p) => p.city === city)
    : province
      ? DEMO_PROPERTIES.filter((p) => p.province === byId(province).label)
      : []

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="relative overflow-hidden rounded-3xl border border-champagne/15 bg-night shadow-lift">
        <div className="absolute left-4 top-4 z-10">
          <DemoBadge label={pick(DEMO_LOCATION_NETWORK.label, '演示房源网络')} className="border-champagne/30 bg-night/70 text-sand" />
        </div>
        <div className="absolute right-4 top-4 z-10 flex gap-1.5">
          <GraphButton label={pick('Zoom in', '放大')} onClick={() => zoom(1.2)}>
            <Plus className="size-4" />
          </GraphButton>
          <GraphButton label={pick('Zoom out', '缩小')} onClick={() => zoom(1 / 1.2)}>
            <Minus className="size-4" />
          </GraphButton>
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-champagne/25 bg-night/70 px-3 text-xs font-medium text-sand transition-colors hover:bg-coffee/60"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" /> {pick('Reset view', '重置视图')}
          </button>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="block h-[420px] w-full touch-none select-none sm:h-[520px]"
          role="img"
          aria-label={pick('Relationship graph of provinces and cities in the demo homestay network. A text list follows.', '演示民宿网络中省份与城市的关系图，下方附有文字列表。')}
          onWheel={(e) => {
            if (!e.ctrlKey && !e.metaKey) return
            e.preventDefault()
            zoom(e.deltaY < 0 ? 1.1 : 1 / 1.1)
          }}
          onPointerDown={(e) => {
            if ((e.target as Element).closest('[data-node]')) return
            drag.current = { id: null, moved: false, panStart: { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y } }
            ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
          }}
          onPointerMove={(e) => {
            const d = drag.current
            if (d.id) {
              const n = byId(d.id)
              const p = toLocal(e.clientX, e.clientY)
              n.x = p.x
              n.y = p.y
              d.moved = true
            } else if (d.panStart) {
              const rect = svgRef.current!.getBoundingClientRect()
              const s = W / rect.width
              setView((v) => ({
                ...v,
                x: d.panStart!.vx + (e.clientX - d.panStart!.x) * s,
                y: d.panStart!.vy + (e.clientY - d.panStart!.y) * s,
              }))
            }
          }}
          onPointerUp={() => {
            const d = drag.current
            if (d.id) {
              const n = byId(d.id)
              n.fixed = false
              if (!d.moved) activate(n)
            }
            drag.current = { id: null, moved: false }
          }}
        >
          <defs>
            <radialGradient id="glow" cx="50%" cy="45%" r="65%">
              <stop offset="0%" stopColor="#3A2418" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#211812" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width={W} height={H} fill="url(#glow)" />
          <g transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {nodes
              .filter((n) => n.parent && visible(n))
              .map((n) => {
                const p = byId(n.parent!)
                const mx = (n.x + p.x) / 2
                const my = (n.y + p.y) / 2
                const nx = -(n.y - p.y) * 0.18
                const ny = (n.x - p.x) * 0.18
                const lit = related?.has(n.id) && related.has(p.id)
                return (
                  <path
                    key={`l-${n.id}`}
                    d={`M${p.x},${p.y} Q${mx + nx},${my + ny} ${n.x},${n.y}`}
                    fill="none"
                    stroke="#C69A52"
                    strokeOpacity={lit ? 0.75 : related ? 0.08 : 0.26}
                    strokeWidth={lit ? 1.6 : 1}
                    className="transition-[stroke-opacity] duration-200"
                  />
                )
              })}
            {nodes.filter(visible).map((n) => {
              const dim = related && !related.has(n.id)
              const selected = n.id === province || (n.kind === 'city' && n.label === city)
              return (
                <g
                  key={n.id}
                  data-node
                  transform={`translate(${n.x} ${n.y})`}
                  className={cn('cursor-pointer transition-opacity duration-200', dim && 'opacity-25')}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover(null)}
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    ;(svgRef.current as Element).setPointerCapture(e.pointerId)
                    n.fixed = true
                    drag.current = { id: n.id, moved: false }
                  }}
                >
                  {n.kind === 'province' && (
                    <circle r={n.r + 10} fill="#C69A52" opacity={selected ? 0.22 : 0.08} />
                  )}
                  <circle
                    r={n.r}
                    fill={n.kind === 'province' ? '#C69A52' : n.color}
                    fillOpacity={n.kind === 'province' ? 0.92 : 0.95}
                    stroke={selected ? '#FFFDFC' : '#211812'}
                    strokeWidth={selected ? 2 : 1.5}
                  />
                  {n.kind === 'province' && (
                    <text
                      textAnchor="middle"
                      dy="0.35em"
                      className="fill-night font-sans text-[15px] font-bold"
                    >
                      {n.count}
                    </text>
                  )}
                  <text
                    textAnchor="middle"
                    y={n.r + (n.kind === 'province' ? 20 : 16)}
                    className={cn(
                      'pointer-events-none font-sans',
                      n.kind === 'province'
                        ? 'fill-sand text-[14px] font-semibold tracking-wide'
                        : 'fill-paper/80 text-[12px]',
                    )}
                  >
                    {n.label}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
        <p className="pointer-events-none absolute bottom-3 left-4 text-[11px] text-sand/50">
          {narrow ? pick('Tap a province to reveal its cities', '点击省份查看其城市') : pick('Drag to move · Ctrl + scroll to zoom', '拖动移动 · Ctrl + 滚轮缩放')}
        </p>
      </div>

      {/* Side panel + accessible text alternative */}
      <aside className="flex flex-col gap-4">
        <div className="rounded-3xl border border-border bg-paper p-5 shadow-soft" aria-live="polite">
          {city || province ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="eyebrow text-champagne">{city ? pick('City', '城市') : pick('Province', '省份')}</p>
                  <h3 className="mt-1 text-2xl font-semibold text-walnut">
                    {city ?? byId(province!).label}
                  </h3>
                  {city && (
                    <p className="text-sm text-stone">
                      {pick(`${openTasksForCity(city)} open ${openTasksForCity(city) === 1 ? 'task' : 'tasks'} (demo)`, `${openTasksForCity(city)} 个待处理任务（演示）`)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  aria-label={pick('Clear selection', '清除选择')}
                  onClick={() => {
                    setCity(null)
                    setProvince(null)
                  }}
                  className="grid size-8 place-items-center rounded-full text-stone hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              </div>
              <ul className="mt-4 space-y-2.5">
                {listProperties.map((p) => (
                  <li key={p.property_id} className="rounded-2xl border border-border/80 bg-ivory/60 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-walnut">{p.name}</p>
                      <StatusDot status={p.status} />
                    </div>
                    <p className="text-xs text-stone">
                      {p.city} · {pick(`${openTasksForCity(p.city)} pending in city`, `该城市 ${openTasksForCity(p.city)} 个待处理`)}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="eyebrow text-champagne">{pick('Explore', '探索')}</p>
              <p className="mt-2 text-sm text-stone">
                {pick(
                  'Select a province to filter its cities and homestays, or a city to see each property’s status and pending tasks.',
                  '选择省份可筛选其城市与民宿，选择城市可查看各房源的状态和待处理任务。',
                )}
              </p>
            </>
          )}
        </div>

        <nav aria-label={pick('Location list', '地区列表')} className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
          <p className="eyebrow mb-3 text-champagne">{pick('Text view', '文字视图')}</p>
          <ul className="space-y-3">
            {DEMO_LOCATION_NETWORK.provinces.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={province === p.id && !city}
                  onClick={() => {
                    setProvince(province === p.id && !city ? null : p.id)
                    setCity(null)
                  }}
                  className="text-left font-semibold text-walnut hover:text-champagne"
                >
                  {p.name}
                </button>
                <ul className="mt-1 flex flex-wrap gap-1.5">
                  {p.cities.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        aria-pressed={city === c}
                        onClick={() => {
                          setProvince(p.id)
                          setCity(c)
                        }}
                        className={cn(
                          'rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                          city === c
                            ? 'border-walnut bg-walnut text-paper'
                            : 'border-border text-stone hover:border-champagne hover:text-walnut',
                        )}
                      >
                        {c}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  )
}

function GraphButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-champagne/25 bg-night/70 text-sand transition-colors hover:bg-coffee/60"
    >
      {children}
    </button>
  )
}

export function StatusDot({ status }: { status: Property['status'] }) {
  const { tv } = useLanguage()
  const color = status === 'Operating' ? 'bg-sage' : status === 'Limited' ? 'bg-champagne' : 'bg-terracotta'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-stone">
      <span className={cn('size-2 rounded-full', color)} aria-hidden="true" />
      {tv(status)}
    </span>
  )
}
