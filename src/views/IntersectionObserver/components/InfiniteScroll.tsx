import { useState, useEffect, useRef, useCallback } from 'react'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import styled from 'styled-components'

interface ListItem {
  id: number
  title: string
  content: string
}

const InfiniteScrollStyle = styled.div`
  .data-list {
    min-height: calc(100vh - 168px - 190px);
    margin-top: 20px;
  }
  .data-item {
    background: #f8f9fa;
    padding: 20px;
    margin-bottom: 15px;
    border-radius: 8px;
    border-left: 4px solid #3498db;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
  }
  .data-item.animate {
    opacity: 1;
    transform: translateY(0);
  }
  .data-item h3 {
    color: #2c3e50;
    margin-bottom: 8px;
  }
  .data-item p {
    color: #7f8c8d;
    line-height: 1.6;
  }
  .loading-more {
    text-align: center;
    padding: 20px;
    color: #7f8c8d;
    height: 60px;
  }
  .loading-more .spinner {
    display: inline-block;
    width: 30px;
    height: 30px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 10px;
    vertical-align: middle;
  }
  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`

const AnimatedItem = ({ item, delay }: { item: ListItem; delay: number }) => {
  const [ref, isIntersecting] = useIntersectionObserver({
    triggerOnce: true,
    threshold: 0.2,
    rootMargin: '0px'
  })
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    if (isIntersecting) {
      setTimeout(() => {
        setIsAnimated(true)
      }, delay)
    }
  }, [isIntersecting, delay])

  return (
    <div ref={ref} className={`data-item ${isAnimated ? 'animate' : ''}`}>
      <h3>{item.title}</h3>
      <p>{item.content}</p>
    </div>
  )
}

export default function InfiniteScroll() {
  /* ---------- 状态管理 ---------- */
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const initialized = useRef(false)

  // 使用优化后的观察器钩子，获取控制方法
  const [loadMoreRef, isIntersecting, observerControls] =
    useIntersectionObserver({
      triggerOnce: false,
      threshold: 0.1,
      rootMargin: '0px 0px 200px 0px',
      cooldown: 800
    })

  /* ---------- 数据加载函数 ---------- */
  const loadMoreData = useCallback(async () => {
    // 防止重复加载
    if (loading || !hasMore) return

    // 开始加载时暂停观察器
    observerControls.pause()
    setLoading(true)
    console.log('👉 加载第', page, '页数据')

    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newItems = Array.from({ length: 10 }, (_, i) => ({
        id: (page - 1) * 10 + i + 1,
        title: `数据项: Item ${String((page - 1) * 10 + i + 1)}`,
        content: `这是第 ${String(page)} 页的第 ${String(i + 1)} 条数据。`
      }))

      setItems(prev => [...prev, ...newItems])
      setPage(prev => prev + 1)

      if (page >= 5) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
      // 加载完成后重置并恢复观察器
      observerControls.reset()
    }
  }, [loading, hasMore, page, observerControls])

  /* ---------- 初始化加载 ---------- */
  useEffect(() => {
    if (!initialized.current) {
      console.log('初始化加载第一页数据')
      initialized.current = true
      void loadMoreData()
    }
  }, [loadMoreData])

  /* ---------- 处理滚动加载触发 ---------- */
  useEffect(() => {
    console.log('观察器状态变化:', isIntersecting)
    // 只有满足所有条件时才触发加载
    if (isIntersecting && !loading && hasMore && initialized.current) {
      console.log('触发加载更多数据==========》')
      void loadMoreData()
    }
  }, [isIntersecting, loading, hasMore, loadMoreData, initialized])

  /* ---------- 渲染 ---------- */
  return (
    <InfiniteScrollStyle>
      <div className="data-list">
        {items.map((item, index) => (
          <AnimatedItem key={item.id} item={item} delay={(index % 5) * 100} />
        ))}
      </div>

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="loading-more"
          style={{ border: '3px solid red' }}
        >
          {loading ? (
            <>
              <div className="spinner" />
              加载中...
            </>
          ) : (
            '向下滚动加载更多'
          )}
        </div>
      )}

      {!hasMore && <div className="loading-more">已加载全部数据</div>}
    </InfiniteScrollStyle>
  )
}
