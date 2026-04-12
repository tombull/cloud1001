import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Fade from 'embla-carousel-fade'

import { cn } from '@/lib/utils'

const RANDOMIZED_AT_STORAGE_KEY = 'cloud1001.homeHero.lastRandomizedAt'
const RANDOMIZATION_WINDOW_MS = 60_000

interface HeroImage {
  src: string
  alt?: string
}

interface HomeHeroCarouselProps {
  images: HeroImage[]
  className?: string
}

function createSeededRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

function shuffleImages(images: HeroImage[], seed: number) {
  const randomizedImages = [...images]
  const random = createSeededRandom(seed)

  for (let index = randomizedImages.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const currentImage = randomizedImages[index]

    randomizedImages[index] = randomizedImages[swapIndex]
    randomizedImages[swapIndex] = currentImage
  }

  return randomizedImages
}

function getRandomizationSeed() {
  const now = Date.now()

  try {
    const storedValue = window.localStorage.getItem(RANDOMIZED_AT_STORAGE_KEY)
    const storedTimestamp = storedValue ? Number(storedValue) : NaN
    const hasRecentTimestamp =
      Number.isFinite(storedTimestamp) &&
      now - storedTimestamp < RANDOMIZATION_WINDOW_MS
    const seed = hasRecentTimestamp ? storedTimestamp : now

    if (!hasRecentTimestamp) {
      window.localStorage.setItem(RANDOMIZED_AT_STORAGE_KEY, String(seed))
    }

    return seed
  } catch {
    return now
  }
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

export default function HomeHeroCarousel({
  images,
  className,
}: HomeHeroCarouselProps) {
  const autoplay = useRef(
    Autoplay({
      delay: 5500,
      stopOnMouseEnter: true,
      stopOnInteraction: false,
    }),
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [randomizedImages, setRandomizedImages] = useState<HeroImage[]>([])
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: 'start',
      containScroll: false,
      dragFree: false,
      loop: true,
    },
    [Fade(), autoplay.current],
  )

  useIsomorphicLayoutEffect(() => {
    if (!images.length) {
      setRandomizedImages(images)
      return
    }

    const seed = getRandomizationSeed()
    setRandomizedImages(shuffleImages(images, seed))
    setSelectedIndex(0)
  }, [images])

  useEffect(() => {
    if (!emblaApi) return

    emblaApi.reInit()
    emblaApi.scrollTo(0, true)
  }, [emblaApi, randomizedImages])

  useEffect(() => {
    if (!emblaApi) return

    const updateSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    updateSelectedIndex()
    emblaApi.on('select', updateSelectedIndex)
    emblaApi.on('reInit', updateSelectedIndex)

    return () => {
      emblaApi.off('select', updateSelectedIndex)
      emblaApi.off('reInit', updateSelectedIndex)
    }
  }, [emblaApi])

  if (!randomizedImages.length) {
    return (
      <div
        className={cn(
          'bg-surface-container-low relative h-[60vh] min-h-[400px] w-full overflow-hidden',
          className,
        )}
      />
    )
  }

  return (
    <div
      className={cn(
        'group bg-surface-container-low relative h-[60vh] min-h-[400px] w-full overflow-hidden',
        className,
      )}
    >
      <div className="absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(14,14,14,0.24)_0%,rgba(14,14,14,0.1)_28%,rgba(14,14,14,0.5)_100%)]" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top_right,rgba(161,250,255,0.18),transparent_38%)]" />

      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {randomizedImages.map((image, index) => (
            <div
              className="relative h-full min-w-0 flex-[0_0_100%]"
              key={image.src}
            >
              <img
                alt={image.alt ?? ''}
                aria-hidden={image.alt ? undefined : true}
                className="h-full w-full object-cover object-center"
                draggable={false}
                fetchPriority={index === 0 ? 'high' : undefined}
                loading={index === 0 ? 'eager' : 'lazy'}
                src={image.src}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute right-5 bottom-5 z-20 flex items-center gap-2 md:right-8 md:bottom-8">
        {randomizedImages.map((image, index) => (
          <button
            aria-label={`Show hero image ${index + 1}`}
            className={cn(
              'pointer-events-auto h-1.5 w-8 border border-white/20 bg-white/18 transition-all duration-300 ease-out',
              index === selectedIndex &&
                'border-primary/70 bg-primary shadow-[0_0_18px_rgba(161,250,255,0.35)]',
            )}
            key={image.src}
            onClick={() => {
              emblaApi?.scrollTo(index)
              autoplay.current.reset()
            }}
            type="button"
          />
        ))}
      </div>
    </div>
  )
}
