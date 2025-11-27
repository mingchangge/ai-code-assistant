import { useState, useCallback, useEffect, useRef } from 'react'
import { createMarkdownInstance, parseHeadings } from '@/utils/utils'
import type { TocItem } from '../types'
import { useImageCache } from './useImageCache'

// 创建单例的Markdown实例
const md = createMarkdownInstance()

export const useMarkdownContent = (fileName: string, docsPath: string) => {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [isContentLoaded, setIsContentLoaded] = useState(false)
  const htmlContentRef = useRef<string>('')
  const articleRef = useRef<HTMLDivElement>(null)
  const headingsRef = useRef<HTMLHeadingElement[]>([])

  // 文档ID
  const documentId = `${docsPath}/${fileName}`

  // 使用图片缓存Hook
  const { documentImageCount, clearDocumentCache } = useImageCache(
    articleRef,
    documentId,
    isContentLoaded
  )

  // 加载markdown内容
  const loadContent = useCallback(() => {
    setIsContentLoaded(false)
    fetch(`${docsPath}/${fileName}`)
      .then(r => r.text())
      .then(src => {
        const html = md.render(src)
        htmlContentRef.current = html
        const newHeadings = parseHeadings(html)
        setHeadings(newHeadings)
        setIsContentLoaded(true)
      })
      .catch(() => {
        htmlContentRef.current = '<p>加载失败</p>'
        setIsContentLoaded(true)
      })
  }, [fileName, docsPath])

  // 仅在fileName变化时加载内容
  useEffect(() => {
    loadContent()
    // 监听HMR
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', loadContent)
    }
  }, [loadContent])

  // 渲染内容到DOM
  useEffect(() => {
    if (!articleRef.current || !htmlContentRef.current || !isContentLoaded) {
      return
    }

    // 直接操作DOM
    articleRef.current.innerHTML = htmlContentRef.current

    // 更新headingsRef
    const headingElements = Array.from(
      articleRef.current.querySelectorAll<HTMLHeadingElement>(
        'h1,h2,h3,h4,h5,h6'
      )
    )
    headingsRef.current = headingElements

    // 为每个标题添加data-index属性
    headingElements.forEach((heading, index) => {
      heading.setAttribute('data-index', index.toString())
    })
  }, [isContentLoaded])

  return {
    headings,
    isContentLoaded,
    articleRef,
    headingsRef,
    documentImageCount,
    clearDocumentCache
  }
}
