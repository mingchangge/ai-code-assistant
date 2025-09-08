import { useEffect, useRef, useState } from 'react'

type UseIntersectionObserverOptions = IntersectionObserverInit & {
  triggerOnce?: boolean
}
function useIntersectionObserver(options: UseIntersectionObserverOptions = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null)
  const ref = useRef<Element>(null)
  const observerRef = useRef<IntersectionObserver>(null)

  useEffect(() => {
    // 创建 Intersection Observer
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
        setIsIntersecting(entry.isIntersecting)

        // 如果元素进入视口且只观察一次，可以取消观察，应用场景：图片懒加载、滚动触发动画、曝光上报
        if (entry.isIntersecting && options.triggerOnce) {
          observerRef.current?.unobserve(entry.target)
        }
      },
      {
        root: options.root ?? undefined,
        rootMargin: options.rootMargin ?? '0px',
        threshold: options.threshold ?? 0.1
      }
    )

    // 开始观察元素
    if (ref.current) {
      observerRef.current.observe(ref.current)
    }

    // 清理函数
    return () => {
      if (observerRef.current && ref.current) {
        observerRef.current.unobserve(ref.current)
      }
    }
  }, [options.root, options.rootMargin, options.threshold, options.triggerOnce])

  return [ref, isIntersecting, entry]
}
export default useIntersectionObserver
