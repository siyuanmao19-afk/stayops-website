import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/language'

/**
 * The three homestay photos supplied by the owner. Place the original files in
 * `public/img/` using these names (see README → "Hero photos").
 */
const SLIDES = [
  {
    file: 'stayops-night-exterior.png',
    original: 'downloaded-image (1).png',
    alt: 'A homestay exterior at night, warm light glowing from its windows against a dark sky',
    caption: 'Calm operations, even after dark.',
    captionZh: '夜幕降临，运营依然从容。',
    focus: 'object-[50%_55%] md:object-center',
  },
  {
    file: 'stayops-wooden-room.jpeg',
    original: '1a57e9292a5245a082c1405bd1b81d96.jpeg',
    alt: 'A wooden guest room with a large window looking out over a mountain village',
    caption: 'Local character, consistent service.',
    captionZh: '保留在地温度，也保持服务标准。',
    focus: 'object-[60%_50%] md:object-center',
  },
  {
    file: 'stayops-modern-suite.png',
    original: 'downloaded-image.png',
    alt: 'A bright, modern suite with a freestanding bathtub beside the bed',
    caption: 'Every detail prepared with care.',
    captionZh: '每一个细节，都被认真照顾。',
    focus: 'object-[40%_50%] md:object-center',
  },
]

const INTERVAL = 5500

function imagePath(file: string) {
  return `/img/${encodeURIComponent(file)}`
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

export function HeroCarousel() {
  const { language, pick } = useLanguage()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [failed, setFailed] = useState<Record<number, boolean>>({})
  const reduced = usePrefersReducedMotion()
  const touchX = useRef<number | null>(null)
  const imgRefs = useRef<(HTMLImageElement | null)[]>([])

  // Images that failed before hydration never fire React's onError; catch them here.
  useEffect(() => {
    imgRefs.current.forEach((img, i) => {
      if (img && img.complete && img.naturalWidth === 0) {
        setFailed((f) => ({ ...f, [i]: true }))
      }
    })
  }, [])
  const autoplay = !paused && !reduced

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (!autoplay) return
    const t = window.setTimeout(() => go(index + 1), INTERVAL)
    return () => window.clearTimeout(t)
  }, [autoplay, index, go])

  return (
    <section
      aria-roledescription="carousel"
      aria-label={pick('StayOps homestays', 'StayOps 民宿展示')}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPaused(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault()
          go(index + 1)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          go(index - 1)
        }
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1))
        touchX.current = null
      }}
    >
      <div
        tabIndex={0}
        className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-walnut shadow-lift sm:aspect-[5/4] lg:aspect-[4/5]"
      >
        {SLIDES.map((slide, i) => {
          const active = i === index
          return (
            <div
              key={slide.file}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${SLIDES.length}`}
              aria-hidden={!active}
              className={cn(
                'absolute inset-0 transition-opacity duration-[900ms] ease-out',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              {failed[i] ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(120%_80%_at_30%_20%,#5B3825_0%,#3A2418_55%,#211812_100%)] text-sand/80">
                  <ImageOff className="size-7" aria-hidden="true" />
                  <p className="px-8 text-center text-sm">
                    Photo pending: <span className="font-medium">{slide.original}</span>
                  </p>
                </div>
              ) : (
                <img
                  ref={(el) => {
                    imgRefs.current[i] = el
                  }}
                  src={imagePath(slide.file)}
                  sizes="(min-width: 1024px) 560px, 100vw"
                  alt={slide.alt}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : 'auto'}
                  decoding="async"
                  onError={() => setFailed((f) => ({ ...f, [i]: true }))}
                  className={cn('h-full w-full object-cover', slide.focus)}
                  style={
                    active && !reduced
                      ? {
                          animation: `kenburns ${INTERVAL + 900}ms ease-out forwards`,
                          animationPlayState: paused ? 'paused' : 'running',
                        }
                      : undefined
                  }
                />
              )}
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night/80 via-night/30 to-transparent" />

        <p
          key={index}
          aria-live={autoplay ? 'off' : 'polite'}
          className="animate-rise-in absolute bottom-16 left-6 right-6 font-display text-2xl italic text-paper sm:text-3xl"
        >
          {language === 'zh' ? SLIDES[index].captionZh : SLIDES[index].caption}
        </p>

        <div className="absolute inset-x-6 bottom-6 flex items-center gap-3">
          <div className="flex gap-2" role="tablist" aria-label={pick('Choose slide', '选择图片')}>
            {SLIDES.map((s, i) => (
              <button
                key={s.file}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={language === 'zh' ? `显示第 ${i + 1} 张图片：${s.captionZh}` : `Show slide ${i + 1}: ${s.caption}`}
                onClick={() => go(i)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  i === index ? 'w-6 bg-sand' : 'w-2 bg-paper/50 hover:bg-paper/80',
                )}
              />
            ))}
          </div>
          <div className="relative h-[2px] flex-1 overflow-hidden rounded-full bg-paper/25">
            {autoplay && (
              <span
                key={index}
                className="absolute inset-0 origin-left bg-sand"
                style={{ animation: `progress-fill ${INTERVAL}ms linear forwards` }}
              />
            )}
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              aria-label={pick('Previous slide', '上一张图片')}
              onClick={() => go(index - 1)}
              className="grid size-9 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur-sm transition-colors hover:bg-paper/30"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label={pick('Next slide', '下一张图片')}
              onClick={() => go(index + 1)}
              className="grid size-9 place-items-center rounded-full bg-paper/15 text-paper backdrop-blur-sm transition-colors hover:bg-paper/30"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

