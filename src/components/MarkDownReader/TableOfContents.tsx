import { useEffect, useState, useRef, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'

// 目录项接口
interface TocItem {
  id: string
  text: string
  level: number
}

// 目录组件属性接口
interface TableOfContentsProps {
  html: string
  onItemClick?: (id: string) => void
  onToggle?: (expanded: boolean) => void
  className?: string
}

// 展开动画
const expandAnimation = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
    max-height: 0;
  }
  to {
    opacity: 1;
    transform: translateX(0);
    max-height: calc(100vh - 140px);
  }
`

// 收起动画
const collapseAnimation = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
    max-height: calc(100vh - 140px);
  }
  to {
    opacity: 0;
    transform: translateX(20px);
    max-height: 0;
  }
`

// 目录图标容器样式
const TocIconContainer = styled.div`
  position: fixed;
  top: 100px;
  right: 72px;
  width: 48px;
  height: 48px;
  background: #1890ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.4);
  z-index: 1001;
  transition: all 0.3s ease;

  &:hover {
    background: #40a9ff;
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.6);
  }

  &:active {
    transform: scale(0.95);
  }
`

// 目录图标样式
const TocIcon = styled.div.withConfig({
  shouldForwardProp: prop => !['isExpanded'].includes(prop)
})<{ isExpanded: boolean }>`
  width: 24px;
  height: 24px;
  position: relative;
  transition: all 0.3s ease;

  &::before,
  &::after {
    content: '';
    position: absolute;
    background: white;
    transition: all 0.3s ease;
  }

  &::before {
    width: 18px;
    height: 2px;
    top: 8px;
    left: 3px;
    box-shadow:
      0 4px 0 0 white,
      0 8px 0 0 white;
  }

  &::after {
    width: 2px;
    height: 18px;
    top: 3px;
    left: 11px;
    opacity: ${props => (props.isExpanded ? 1 : 0)};
    transform: ${props =>
      props.isExpanded ? 'rotate(45deg)' : 'rotate(0deg)'};
  }
`

// 目录容器样式
const TocContainer = styled.div.withConfig({
  shouldForwardProp: prop => !['isExpanded'].includes(prop)
})<{ isExpanded: boolean }>`
  position: fixed;
  top: 100px;
  right: 20px;
  width: 280px;
  height: ${props => (props.isExpanded ? 'calc(100vh - 140px)' : '0')};
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: ${props =>
      props.isExpanded ? expandAnimation : collapseAnimation}
    0.3s ease forwards;
  transition: height 0.3s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`

// 目录标题容器样式
const TocHeader = styled.div.withConfig({
  shouldForwardProp: prop => !['isExpanded'].includes(prop)
})<{ isExpanded: boolean }>`
  padding: 10px 16px 10px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  flex-shrink: 0;
  z-index: 10;
  opacity: ${props => (props.isExpanded ? 1 : 0)};
  transition: opacity 0.3s ease;
`

// 目录标题样式
const TocTitle = styled.h3`
  height: 32px;
  line-height: 32px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
`

// 目录内容容器样式
const TocContent = styled.div.withConfig({
  shouldForwardProp: prop => !['isExpanded'].includes(prop)
})<{ isExpanded: boolean }>`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  margin: 10px 0;
  padding: 0 16px 16px 16px;
  opacity: ${props => (props.isExpanded ? 1 : 0)};
  transition: opacity 0.3s ease;

  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }
`

// 目录项样式
const TocItemStyled = styled.div.withConfig({
  shouldForwardProp: prop => !['level', 'isActive', 'isExpanded'].includes(prop)
})<{ level: number; isActive: boolean; isExpanded: boolean }>`
  margin-left: ${props => (props.level - 1) * 16}px;
  margin-bottom: 4px;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.4;
  transition: all 0.2s ease;
  color: ${props => (props.isActive ? '#1890ff' : '#666')};
  background: ${props => (props.isActive ? '#e6f7ff' : 'transparent')};
  border-left: ${props => (props.isActive ? '3px solid #1890ff' : 'none')};
  opacity: ${props => (props.isExpanded ? 1 : 0)};
  transform: ${props =>
    props.isExpanded ? 'translateX(0)' : 'translateX(10px)'};
  transition: all 0.3s ease ${props => props.level * 0.05}s;

  &:hover {
    color: #1890ff;
    background: #f0f8ff;
  }
`

/**
 * 生成稳定的标题ID
 * @param text - 标题文本
 * @param index - 标题索引
 * @returns 稳定的ID字符串
 */
const generateStableId = (text: string, index: number): string => {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `heading-${slug}-${index.toString()}`
}

/**
 * 目录组件 - 修复点击跳转和ID设置问题
 * @param html - 渲染后的HTML内容
 * @param onItemClick - 点击目录项的回调函数
 * @param onToggle - 目录展开状态变化的回调函数
 * @param className - 自定义样式类名
 */
const TableOfContents = ({
  html,
  onItemClick,
  onToggle,
  className = ''
}: TableOfContentsProps) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const [isExpanded, setIsExpanded] = useState<boolean>(false)
  const articleRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const mutationObserverRef = useRef<MutationObserver | null>(null)
  const scrollContainerRef = useRef<Element | null>(null)

  // 处理目录展开/收起
  const handleToggle = useCallback(() => {
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)
    if (onToggle) {
      onToggle(newExpandedState)
    }
  }, [isExpanded, onToggle])

  // 从HTML中提取标题
  useEffect(() => {
    if (!html) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    const items: TocItem[] = Array.from(headings).map((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const text = heading.textContent ?? `标题 ${(index + 1).toString()}`
      const id = generateStableId(text, index)

      return { id, text, level }
    })

    setTocItems(items)
  }, [html])
  // 查找真正的滚动容器 - 递归向上查找具有overflow: auto/scroll的祖先
  const findScrollContainer = (element: Element): Element | null => {
    let current = element.parentElement

    while (current) {
      const style = window.getComputedStyle(current)
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return current
      }
      current = current.parentElement
    }

    // 如果没有找到，返回document.documentElement
    return document.documentElement
  }
  // 设置标题ID并监听DOM变化 - 核心修复
  useEffect(() => {
    if (tocItems.length === 0) return

    // 查找文章容器
    articleRef.current = document.querySelector('.article-container')
    if (!articleRef.current) {
      console.warn('未找到文章容器')
      return
    }
    // 找到真正的滚动容器
    const scrollContainer = findScrollContainer(articleRef.current)
    scrollContainerRef.current = scrollContainer
    console.log('滚动容器:', scrollContainer)

    // 清理之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect()
    }
    if (mutationObserverRef.current) {
      mutationObserverRef.current.disconnect()
    }

    // 设置标题ID的函数
    const setupHeadingIds = () => {
      const articleHeadings = articleRef.current?.querySelectorAll(
        'h1, h2, h3, h4, h5, h6'
      )
      if (!articleHeadings) return

      articleHeadings.forEach((heading, index) => {
        if (index < tocItems.length) {
          // 确保每个标题都有正确的ID
          heading.id = tocItems[index].id
        }
      })
    }

    // 立即设置ID
    setupHeadingIds()

    // 创建MutationObserver监听DOM变化
    mutationObserverRef.current = new MutationObserver(() => {
      setupHeadingIds()
    })

    // 观察文章容器内的变化
    mutationObserverRef.current.observe(articleRef.current, {
      childList: true,
      subtree: true,
      characterData: true
    })

    // 创建IntersectionObserver监听标题可见性
    observerRef.current = new IntersectionObserver(
      entries => {
        let closestHeading: Element | null = null
        let minDistance = Infinity

        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.target.getBoundingClientRect()
            const distance = Math.abs(rect.top - 100) // 考虑固定导航栏高度

            if (distance < minDistance) {
              minDistance = distance
              closestHeading = entry.target
            }
          }
        }

        if (closestHeading) {
          setActiveId(closestHeading.id)
        }
      },
      {
        root: articleRef.current,
        rootMargin: '-100px 0px -50% 0px', // 考虑固定导航栏
        threshold: [0, 0.1, 0.5, 0.9, 1]
      }
    )

    // 观察所有标题元素
    const articleHeadings = articleRef.current.querySelectorAll(
      'h1, h2, h3, h4, h5, h6'
    )
    articleHeadings.forEach(heading => {
      observerRef.current?.observe(heading)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
      if (mutationObserverRef.current) {
        mutationObserverRef.current.disconnect()
      }
    }
  }, [tocItems])

  // 处理目录项点击 - 修复滚动定位
  const handleItemClick = useCallback(
    (id: string) => {
      if (!articleRef.current) return

      // 在文章容器内查找目标元素
      const element = articleRef.current.querySelector(`#${id}`)
      if (!element) {
        console.warn('未找到目标元素:', id)
        return
      }
      // 如果没有滚动容器，直接返回
      if (!scrollContainerRef.current) {
        console.warn('未找到滚动容器')
        return
      }

      // 计算精确滚动位置 - 考虑固定导航栏高度
      const headerOffset = 120 // 固定导航栏高度 + 额外间距
      const elementRect = element.getBoundingClientRect()
      const containerRect = scrollContainerRef.current.getBoundingClientRect()

      // 计算元素相对于滚动容器的顶部位置
      const relativeTop = elementRect.top - containerRect.top
      const scrollPosition = relativeTop - headerOffset

      console.log('滚动到:', {
        elementId: id,
        relativeTop,
        scrollPosition,
        container: scrollContainerRef.current
      })

      // 在正确的滚动容器上执行滚动
      if (scrollContainerRef.current === document.documentElement) {
        // 如果是页面级滚动
        window.scrollBy({
          top: scrollPosition,
          behavior: 'smooth'
        })
      } else {
        // 如果是容器内滚动
        scrollContainerRef.current.scrollBy({
          top: scrollPosition,
          behavior: 'smooth'
        })
      }

      // 立即设置active状态
      setActiveId(id)

      // 触发回调
      if (onItemClick) {
        onItemClick(id)
      }
    },
    [onItemClick]
  )

  // 如果没有目录项，不渲染组件
  if (tocItems.length === 0) {
    return null
  }

  return (
    <>
      {/* 目录图标 */}
      <TocIconContainer
        onClick={handleToggle}
        title={isExpanded ? '收起目录' : '展开目录'}
      >
        <TocIcon isExpanded={isExpanded} />
      </TocIconContainer>

      {/* 目录内容 */}
      <TocContainer isExpanded={isExpanded} className={className}>
        {/* 固定标题区域 */}
        <TocHeader isExpanded={isExpanded}>
          <TocTitle>📚 目录</TocTitle>
        </TocHeader>

        {/* 可滚动的内容区域 */}
        <TocContent isExpanded={isExpanded}>
          {tocItems.map(item => (
            <TocItemStyled
              key={item.id}
              level={item.level}
              isActive={activeId === item.id}
              isExpanded={isExpanded}
              onClick={() => {
                handleItemClick(item.id)
              }}
              title={item.text}
            >
              {item.text}
            </TocItemStyled>
          ))}
        </TocContent>
      </TocContainer>
    </>
  )
}

export default TableOfContents
