import { useEffect, useRef, useState } from 'react'

type Options = IntersectionObserverInit & {
  triggerOnce?: boolean
  cooldown?: number
}

export default function useIntersectionObserver<
  T extends Element = HTMLDivElement
>(options: Options = {}) {
  const ref = useRef<T | null>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const hasTriggered = useRef(false)
  const lastTriggerTime = useRef(0)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const isPaused = useRef(false) // 新增：用于暂停观察器

  // 暂停观察器
  const pause = () => {
    isPaused.current = true
  }

  // 恢复观察器
  const resume = () => {
    isPaused.current = false
    hasTriggered.current = false
  }

  // 重置观察器
  const reset = () => {
    hasTriggered.current = false
    isPaused.current = false
    setIsIntersecting(false)
    if (ref.current && observerRef.current) {
      observerRef.current.unobserve(ref.current)
      observerRef.current.observe(ref.current)
    }
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const {
      triggerOnce = false,
      root = null,
      rootMargin = '0px',
      threshold = 0.1,
      cooldown = 500
    } = options

    const observer = new IntersectionObserver(
      ([entry]) => {
        // 如果观察器被暂停，不处理任何事件
        if (isPaused.current) return

        const now = Date.now()
        if (now - lastTriggerTime.current < cooldown) {
          return
        }

        if (triggerOnce && hasTriggered.current) {
          return
        }

        if (entry.isIntersecting) {
          setIsIntersecting(true)
          lastTriggerTime.current = now

          if (triggerOnce) {
            hasTriggered.current = true
            observer.unobserve(el)
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false)
        }
      },
      { root, rootMargin, threshold }
    )

    observerRef.current = observer
    observer.observe(el)

    return () => {
      observer.disconnect()
      observerRef.current = null
    }
  }, [options])

  return [ref, isIntersecting, { pause, resume, reset }] as const
}
