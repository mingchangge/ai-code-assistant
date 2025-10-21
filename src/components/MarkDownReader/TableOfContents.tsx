import { useState, useCallback } from 'react'
import styled, { keyframes } from 'styled-components'

// 目录项接口
interface TocItem {
  index: number
  text: string
  level: number
}

// 目录组件属性接口
interface TableOfContentsProps {
  headings: TocItem[]
  onItemClick?: (id: number) => void
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
  h3 {
    height: 32px;
    line-height: 32px;
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #333;
    padding-bottom: 8px;
  }
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
 * 目录组件
 */
export default function TableOfContents({
  headings,
  onItemClick,
  className = ''
}: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleToggle = useCallback(() => {
    setIsExpanded(v => !v)
  }, [])

  const handleItemClick = useCallback(
    (index: number) => {
      onItemClick?.(index)
      setActiveIndex(index)
    },
    [onItemClick]
  )

  if (!headings.length) return null

  return (
    <>
      <TocIconContainer
        onClick={handleToggle}
        title={isExpanded ? '收起目录' : '展开目录'}
      >
        <TocIcon isExpanded={isExpanded} />
      </TocIconContainer>

      <TocContainer isExpanded={isExpanded} className={className}>
        <TocHeader isExpanded={isExpanded}>
          <h3 style={{ margin: 0, fontSize: 16 }}>📚 目录</h3>
        </TocHeader>
        <TocContent isExpanded={isExpanded}>
          {headings.map((h, i) => (
            <TocItemStyled
              key={i}
              level={h.level}
              isActive={i === activeIndex}
              isExpanded={isExpanded}
              onClick={() => {
                handleItemClick(i)
              }}
              title={h.text}
            >
              {h.text}
            </TocItemStyled>
          ))}
        </TocContent>
      </TocContainer>
    </>
  )
}
