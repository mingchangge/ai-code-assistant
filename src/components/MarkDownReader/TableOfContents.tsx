import { useEffect, useState, useRef } from 'react'
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
// 目录容器样式 - 修改为固定高度，内部可滚动
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

// 目录标题容器样式 - 固定不滚动
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

// 目录标题样式 - 固定标题
const TocTitle = styled.h3`
  height: 32px;
  line-height: 32px;
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  padding-bottom: 8px;
`

// 目录内容容器样式 - 可滚动区域
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

// 目录项样式 - 修复isActive属性传递问题
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
 * 生成稳定的标题ID - 修复重复key问题
 * @param text - 标题文本
 * @param index - 标题索引
 * @returns 稳定的ID字符串
 */
const generateStableId = (text: string, index: number): string => {
  // 使用文本内容生成slug，确保ID稳定且唯一
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]/g, '-') // 保留中文和字母数字
    .replace(/-+/g, '-') // 合并多个连字符
    .replace(/^-|-$/g, '') // 去除首尾连字符

  // 添加索引确保唯一性，避免重复key问题
  return `heading-${slug}-${index.toString()}`
}

/**
 * 目录组件 - 自动提取Markdown文档中的标题并生成可点击的目录
 * @param html - 渲染后的HTML内容
 * @param onItemClick - 点击目录项的回调函数
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
  const [isExpanded, setIsExpanded] = useState<boolean>(false) // 控制目录展开状态
  const articleRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 处理目录展开/收起
  const handleToggle = () => {
    const newExpandedState = !isExpanded
    setIsExpanded(newExpandedState)

    // 调用onToggle回调，通知父组件目录状态变化
    if (onToggle) {
      onToggle(newExpandedState)
    }
  }

  // 从HTML中提取标题 - 修复重复key问题
  useEffect(() => {
    if (!html) return

    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6')

    const items: TocItem[] = Array.from(headings).map((heading, index) => {
      const level = parseInt(heading.tagName.substring(1))
      const text = heading.textContent ?? `标题 ${(index + 1).toString()}`

      // 生成稳定的ID，确保唯一性
      const id = generateStableId(text, index)

      return { id, text, level }
    })

    setTocItems(items)
  }, [html])

  // 设置IntersectionObserver来监听标题可见性 - 修复isActive样式问题
  useEffect(() => {
    if (tocItems.length === 0) return

    // 清理之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 使用延时确保DOM已经渲染完成
    timeoutRef.current = setTimeout(() => {
      // 查找文章容器
      articleRef.current = document.querySelector('.article-container')
      if (!articleRef.current) {
        console.warn('未找到文章容器')
        return
      }

      // 清理之前的观察器
      if (observerRef.current) {
        observerRef.current.disconnect()
      }

      // 创建新的观察器 - 修复IntersectionObserver配置
      observerRef.current = new IntersectionObserver(
        entries => {
          // 找到最接近顶部的可见标题
          let closestHeading: Element | null = null
          let minDistance = Infinity

          for (const entry of entries) {
            if (entry.isIntersecting) {
              const rect = entry.target.getBoundingClientRect()
              const distance = Math.abs(rect.top)

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
          rootMargin: '-50px 0px -50% 0px', // 优化可见区域
          threshold: [0, 0.25, 0.5, 0.75, 1] // 多个阈值提高精度
        }
      )

      // 观察所有标题元素
      const articleHeadings = articleRef.current.querySelectorAll(
        'h1, h2, h3, h4, h5, h6'
      )

      // 设置标题ID并观察
      articleHeadings.forEach((heading, index) => {
        if (index < tocItems.length) {
          // 确保ID设置正确
          heading.id = tocItems[index].id
          observerRef.current?.observe(heading)
        }
      })
    }, 200) // 增加延时确保DOM完全渲染

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [tocItems])

  // 处理目录项点击 - 修复滚动误差
  const handleItemClick = (id: string) => {
    console.log('点击目录项:', id)
    // 首先尝试在文章容器内查找
    const articleContainer = document.querySelector('.article-container')

    if (!articleContainer) {
      console.warn('未找到文章容器')
      return
    }

    // 在文章容器内查找目标元素
    const element = articleContainer.querySelector(`#${id}`)
    if (element) {
      console.log('找到目标元素:', element)

      // 使用简单的scrollIntoView方法
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
      })

      // 立即设置active状态
      setActiveId(id)

      // 触发回调
      if (onItemClick) {
        onItemClick(id)
      }
    } else {
      console.warn('未找到目标元素:', id)
      console.log(
        '当前文章容器内的标题元素:',
        Array.from(
          articleContainer.querySelectorAll('h1, h2, h3, h4, h5, h6')
        ).map(h => ({
          id: h.id,
          text: h.textContent
        }))
      )
    }
  }

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
              key={item.id} // 使用唯一ID作为key
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
