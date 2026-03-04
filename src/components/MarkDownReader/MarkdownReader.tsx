import { memo, useRef } from 'react'
import TableOfContents from './TableOfContents'
import 'github-markdown-css/github-markdown.css'
import { Container, ScrollHost, StyledArticle } from './styles'
import type { MarkdownReaderProps } from './types'
import { useMarkdownContent } from './hooks/useMarkdownContent'
import { useTableOfContents } from './hooks/useTableOfContents'
import { useFileWatcher } from './hooks/useFileWatcher'

// 优化版MarkdownReader组件
const MarkdownReader = memo(
  ({
    fileName,
    docsPath = '/docs',
    containerHeight = 'calc(100vh - 168px)',
    reloadInterval = 3000
  }: MarkdownReaderProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // 使用自定义hooks
    const { headings, articleRef, headingsRef, reloadContent } =
      useMarkdownContent(fileName, docsPath)
    const { activeIndex, isTocExpanded, setIsTocExpanded, scrollToHeading } =
      useTableOfContents(headingsRef, containerRef)
    // 使用文件监控hook
    useFileWatcher(
      fileName,
      docsPath,
      () => {
        console.log('检测到文件变化，自动重新加载:', fileName)
        reloadContent()
      },
      reloadInterval
    )
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
