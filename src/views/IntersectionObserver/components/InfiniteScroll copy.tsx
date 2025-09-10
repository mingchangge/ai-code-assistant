import { useState, useEffect, useRef, useCallback } from 'react'
import useIntersectionObserver from '@/hooks/useIntersectionObserver'
import styled from 'styled-components'

interface ListItem {
  id: number
  title: string
  content: string
}
// 样式
const InfiniteScrollStyle = styled.div`
  .data-list {
    margin-top: 20px;
    height: 100%;
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
`
// 列表项动画组件
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

function InfiniteScroll() {
  const initRef = useRef(false)
  const [items, setItems] = useState<ListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadMoreRef, isLoadMoreIntersecting] = useIntersectionObserver({
    triggerOnce: true,
    threshold: 1,
    rootMargin: '10px'
  })
  const loadMoreData = useCallback(async () => {
    if (loading || !hasMore) return
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    const newItems = Array.from({ length: 10 }, (_, i) => ({
      id: (page - 1) * 10 + i + 1,
      title: `数据项:Item ${((page - 1) * 10 + i + 1).toString()}`,
      content: `这是第 ${page.toString()} 页的第 ${(i + 1).toString()} 条数据。Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.`
    }))
    setItems(prev => [...prev, ...newItems])
    setPage(prev => prev + 1)
    setLoading(false)

    // 模拟最多加载 5 页
    if (page >= 5) {
      setHasMore(false)
    }
  }, [loading, hasMore, page])
  // 初始化加载数据
  useEffect(() => {
    if (initRef.current) return // 第二次 mount 直接 return
    initRef.current = true
    void loadMoreData()
    console.log('初始化加载数据')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // 监听加载更多元素是否进入视口
  useEffect(() => {
    if (!loading && hasMore && isLoadMoreIntersecting) {
      console.log('加载更多数据')
      void loadMoreData()
    }
  }, [isLoadMoreIntersecting, loading, loadMoreData, hasMore])
  return (
    <InfiniteScrollStyle>
      <div className="data-list">
        {items.map((item: ListItem, index) => (
          <AnimatedItem key={item.id} item={item} delay={(index % 3) * 100} />
        ))}
      </div>
      {hasMore && items.length > 0 && (
        <div
          ref={loadMoreRef}
          key={`sentinel-${page}`}
          className="loading-more"
        >
          {loading ? (
            <>
              <div className="spinner"></div>
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
export default InfiniteScroll
