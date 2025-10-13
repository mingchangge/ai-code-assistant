import { useEffect, useState, useRef } from 'react'
import styled from 'styled-components'

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
  className?: string
}

// 目录容器样式
const TocContainer = styled.div`
  position: fixed;
  top: 100px;
  right: 20px;
  width: 280px;
  max-height: calc(100vh - 140px);
  overflow-y: auto;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;

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

// 目录标题样式
const TocTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #e9ecef;
  padding-bottom: 8px;
`

// 目录项样式 - 修复isActive属性传递问题
const TocItemStyled = styled.div.withConfig({
  shouldForwardProp: prop => !['level', 'isActive'].includes(prop)
})<{ level: number; isActive: boolean }>`
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
  className = ''
}: TableOfContentsProps) => {
  const [tocItems, setTocItems] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const articleRef = useRef<HTMLElement | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

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
    <TocContainer className={className}>
      <TocTitle>📚 目录</TocTitle>
      {tocItems.map(item => (
        <TocItemStyled
          key={item.id} // 使用唯一ID作为key
          level={item.level}
          isActive={activeId === item.id}
          onClick={() => {
            handleItemClick(item.id)
          }}
          title={item.text}
        >
          {item.text}
        </TocItemStyled>
      ))}
    </TocContainer>
  )
}

export default TableOfContents
