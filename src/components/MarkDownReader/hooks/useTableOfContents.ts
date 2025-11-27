import { useState, useCallback, useEffect, useRef } from 'react'
import { throttle } from '@/utils/utils'

export const useTableOfContents = (
  headingsRef: React.RefObject<HTMLHeadingElement[]>,
  containerRef: React.RefObject<HTMLDivElement | null>
) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isTocExpanded, setIsTocExpanded] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 防抖的目录更新函数
  const debouncedSetActiveIndex = useCallback((index: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setActiveIndex(index)
      timeoutRef.current = null
    }, 200)
  }, [])

  // 设置IntersectionObserver观察标题位置
  useEffect(() => {
    if (!containerRef.current || headingsRef.current.length === 0) return

    // 清理之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 创建新的观察器
    observerRef.current = new IntersectionObserver(
      throttle(entries => {
        const visibleEntries = entries.filter(entry => entry.isIntersecting)

        if (visibleEntries.length > 0) {
          visibleEntries.sort((a, b) => {
            return a.boundingClientRect.top - b.boundingClientRect.top
          })
          const currentIndex = Number(
            visibleEntries[0].target.getAttribute('data-index')
          )
          debouncedSetActiveIndex(currentIndex)
        } else {
          // 没有可见元素时，基于滚动位置计算
          const scrollTop = containerRef.current?.scrollTop ?? 0
          let closestIndex = 0
          let minDistance = Infinity

          headingsRef.current.forEach((heading, index) => {
            const headingTop = heading.offsetTop
            const distance = Math.abs(headingTop - scrollTop - 120)
            if (distance < minDistance) {
              minDistance = distance
              closestIndex = index
            }
          })

          debouncedSetActiveIndex(closestIndex)
        }
      }, 100),
      {
        root: containerRef.current,
        rootMargin: '-50px 0px -70% 0px',
        threshold: 0.2
      }
    )

    // 观察所有标题
    headingsRef.current.forEach(heading => {
      observerRef.current?.observe(heading)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
    }
  }, [
    headingsRef,
    containerRef,
    headingsRef.current.length,
    debouncedSetActiveIndex
  ])

  // 滚动到指定标题
  const scrollToHeading = useCallback(
    (index: number) => {
      const el = headingsRef.current[index]
      if (!containerRef.current) return

      // 计算滚动位置
      const containerRect = containerRef.current.getBoundingClientRect()
      const elementRect = el.getBoundingClientRect()
      const relativeTop = elementRect.top - containerRect.top
      const scrollPosition = containerRef.current.scrollTop + relativeTop - 120

      // 滚动到目标位置
      containerRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      })

      // 立即更新活动索引
      setActiveIndex(index)
    },
    [headingsRef, containerRef, setActiveIndex]
  )

  return {
    activeIndex,
    isTocExpanded,
    setIsTocExpanded,
    scrollToHeading
  }
}
