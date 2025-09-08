import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * 批量收集多个被观察元素的 entry
 * 返回当前累积的 entries 数组（只读）
 */
export function useIntersectionObserverBulk(
  options?: IntersectionObserverInit & { throttle?: number }
) {
  const [entries, setEntries] = useState<IntersectionObserverEntry[]>([])
  const observerRef = useRef<IntersectionObserver | null>(null)
  const rootRef = useRef<Element | Document | null>(options?.root ?? null)

  // 把新的 entries 合并进来
  const handleEntries = useCallback(
    (newEntries: IntersectionObserverEntry[]) => {
      setEntries(prev => {
        const map = new Map(prev.map(e => [e.target, e]))
        newEntries.forEach(e => map.set(e.target, e)) // 覆盖旧值
        return Array.from(map.values())
      })
    },
    []
  )

  // 观察函数：调用者把 DOM 节点传进来
  const observe = useCallback((target: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(target)
    }
  }, [])

  // 取消观察
  const unobserve = useCallback((target: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(target)
      // 同时从 entries 里删掉
      setEntries(prev => prev.filter(e => e.target !== target))
    }
  }, [])

  // 创建/销毁 observer
  useEffect(() => {
    const root = rootRef.current instanceof Element ? rootRef.current : null
    observerRef.current = new IntersectionObserver(handleEntries, {
      root,
      rootMargin: options?.rootMargin,
      threshold: options?.threshold ?? 0.1
    })
    return () => observerRef.current?.disconnect()
  }, [handleEntries, options?.rootMargin, options?.threshold])

  return { entries, observe, unobserve }
}
