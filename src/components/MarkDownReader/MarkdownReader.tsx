import { memo, useRef, useEffect } from 'react'
import type { UpdatePayload } from 'vite'
import TableOfContents from './TableOfContents'
import 'github-markdown-css/github-markdown.css'
import { Container, ScrollHost, StyledArticle } from './styles'
import type { MarkdownReaderProps } from './types'
import { useMarkdownContent } from './hooks/useMarkdownContent'
import { useTableOfContents } from './hooks/useTableOfContents'

// MarkdownReader组件
const MarkdownReader = memo(
  ({
    fileName,
    docsPath = '/docs',
    containerHeight = 'calc(100vh - 168px)'
  }: MarkdownReaderProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // 使用自定义hooks
    const { headings, articleRef, headingsRef, reloadContent } =
      useMarkdownContent(fileName, docsPath)
    const { activeIndex, isTocExpanded, setIsTocExpanded, scrollToHeading } =
      useTableOfContents(headingsRef, containerRef)

    useEffect(() => {
      const handleBeforeUpdate = (event: UpdatePayload) => {
        console.log('热更新前触发', event)
        reloadContent()
      }
      if (import.meta.hot) {
        console.log('启用Vite热重载监听')

        // 监听Vite的热重载事件
        import.meta.hot.on('vite:beforeUpdate', handleBeforeUpdate)

        return () => {
          // 清理事件监听器
          import.meta.hot?.off('vite:beforeUpdate', handleBeforeUpdate)
        }
      }
    }, [fileName, docsPath, reloadContent])
    return (
      <Container style={{ height: containerHeight }}>
        {/* 滚动容器 */}
        <ScrollHost isTocExpanded={isTocExpanded} ref={containerRef}>
          {/* 使用ref而不是state来渲染内容 */}
          <StyledArticle className="markdown-body" ref={articleRef} />
        </ScrollHost>

        {/* 目录组件 */}
        <TableOfContents
          key={fileName}
          headings={headings}
          onItemClick={scrollToHeading}
          activeIndex={activeIndex}
          onExpandedChange={setIsTocExpanded}
        />
      </Container>
    )
  }
)

export default MarkdownReader
