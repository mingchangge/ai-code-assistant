import { memo, useRef } from 'react'
import TableOfContents from './TableOfContents'
import 'github-markdown-css/github-markdown.css'
import { Container, ScrollHost, StyledArticle } from './styles'
import type { MarkdownReaderProps } from './types'
import { useMarkdownContent } from './hooks/useMarkdownContent'
import { useTableOfContents } from './hooks/useTableOfContents'

// 优化版MarkdownReader组件
const MarkdownReader = memo(
  ({
    fileName,
    docsPath = '/docs',
    containerHeight = 'calc(100vh - 168px)'
  }: MarkdownReaderProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    // 使用自定义hooks
    const { headings, articleRef, headingsRef } = useMarkdownContent(
      fileName,
      docsPath
    )
    const { activeIndex, isTocExpanded, setIsTocExpanded, scrollToHeading } =
      useTableOfContents(headingsRef, containerRef)

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

// import { useEffect, useRef, useState, useCallback, memo } from 'react'
// import MarkdownIt from 'markdown-it'
// import styled from 'styled-components'
// import TableOfContents from './TableOfContents'
// import 'github-markdown-css/github-markdown.css'
// import ImageCacheManager from '@/utils/ImageCacheManager'

// // 创建Markdown实例
// const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

// // 图片缓存管理实例
// const imageCache = new ImageCacheManager()

// // 样式组件定义
// const Container = styled.div`
//   display: flex;
//   width: 100%;
// `
// const ScrollHost = styled.div.withConfig({
//   shouldForwardProp: prop => !['isTocExpanded'].includes(prop)
// })<{ isTocExpanded: boolean }>`
//   flex: 1;
//   overflow-y: auto;
//   height: 100%;
//   padding-right: ${p => (p.isTocExpanded ? '300px' : '24px')};
// `

// const StyledArticle = styled.article`
//   width: 100%;
//   height: 100%;

//   /* H1短标题 - 红到蓝的强烈渐变 */
//   h1 {
//     background:
//       radial-gradient(
//         circle at 50% 0,
//         rgba(255, 0, 0, 0.5),
//         rgba(255, 0, 0, 0) 70.71%
//       ),
//       radial-gradient(
//         circle at 6.7% 75%,
//         rgba(0, 0, 255, 0.5),
//         rgba(0, 0, 255, 0) 70.71%
//       ),
//       radial-gradient(
//         circle at 93.3% 75%,
//         rgba(0, 255, 0, 0.5),
//         rgba(0, 255, 0, 0) 70.71%
//       ),
//       beige;
//     background-size: 200% 200%;
//     animation: flow 4s linear infinite;
//     -webkit-background-clip: text;
//     background-clip: text;
//     -webkit-text-fill-color: transparent;
//     font-size: 3.2rem;
//     font-weight: 900;
//     text-wrap: balance;
//     scroll-margin-top: 100px;
//   }

//   h2 {
//     background: linear-gradient(183deg, #0066ff 17%, #00cc99 72%);
//     -webkit-background-clip: text;
//     background-clip: text;
//     -webkit-text-fill-color: transparent;
//     font-size: 2.4rem;
//     font-weight: 800;
//     background-size: 100% 200%;
//     text-wrap: balance;
//     scroll-margin-top: 100px;
//   }

//   h3 {
//     background: linear-gradient(183deg, #ff6600 17%, #ffcc00 72%);
//     -webkit-background-clip: text;
//     background-clip: text;
//     -webkit-text-fill-color: transparent;
//     font-size: 2rem;
//     font-weight: 700;
//     background-size: 100% 200%;
//     text-wrap: balance;
//     scroll-margin-top: 100px;
//   }

//   h1,
//   h2,
//   h3,
//   h4,
//   h5,
//   h6 {
//     position: relative;
//     scroll-margin-top: 100px;

//     &:hover::before {
//       content: '#';
//       position: absolute;
//       left: -24px;
//       color: #1890ff;
//       opacity: 0;
//       transition: opacity 0.2s ease;
//     }

//     &:hover::before {
//       opacity: 1;
//     }
//   }

//   img {
//     width: 100%;
//   }

//   @keyframes flow {
//     0% {
//       background-position: 0% 50%;
//     }
//     50% {
//       background-position: 100% 50%;
//     }
//     100% {
//       background-position: 0% 50%;
//     }
//   }
// `

// // 类型定义
// interface TocItem {
//   index: number
//   text: string
//   level: number
// }

// interface Props {
//   fileName: string
//   docsPath?: string
//   containerHeight?: string
// }

// // 节流函数
// const throttle = <T extends unknown[]>(
//   func: (...args: T) => void,
//   limit: number
// ): ((...args: T) => void) => {
//   let inThrottle = false
//   return (...args: T) => {
//     if (!inThrottle) {
//       func(...args)
//       inThrottle = true
//       setTimeout(() => (inThrottle = false), limit)
//     }
//   }
// }

// // 优化版MarkdownReader组件
// const MarkdownReader = memo(
//   ({
//     fileName,
//     docsPath = '/docs',
//     containerHeight = 'calc(100vh - 168px)'
//   }: Props) => {
//     // 只在必要时更新的状态
//     const [headings, setHeadings] = useState<TocItem[]>([])
//     const [isContentLoaded, setIsContentLoaded] = useState(false)
//     const [isTocExpanded, setIsTocExpanded] = useState(false)

//     // 目录高亮状态 - 使用单个状态变量
//     const [activeIndex, setActiveIndex] = useState(0)

//     // 使用ref避免不必要的重渲染
//     const containerRef = useRef<HTMLDivElement>(null)
//     const articleRef = useRef<HTMLDivElement>(null)
//     const headingsRef = useRef<HTMLHeadingElement[]>([])
//     const observerRef = useRef<IntersectionObserver | null>(null)

//     // 记录上一次的documentId，用于切换文档时清理旧文档的缓存
//     const previousDocumentIdRef = useRef<string>('')
//     // 用于存储清理定时器ID
//     const cleanupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
//     // 跟踪当前文档是否包含图片
//     const hasImagesRef = useRef<boolean>(false)
//     // 跟踪每个文档是否包含图片的映射
//     const documentImagesMap = useRef<Map<string, boolean>>(new Map())

//     // 一次性渲染内容的ref
//     const htmlContentRef = useRef<string>('')

//     // 优化1: 使用防抖的目录更新函数
//     // 添加一个ref来存储timeout
//     const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

//     // 在组件内部定义debounce函数
//     const debouncedSetActiveIndex = useCallback(
//       (index: number) => {
//         // 清除之前的定时器
//         if (timeoutRef.current) {
//           clearTimeout(timeoutRef.current)
//         }

//         // 设置新的定时器
//         timeoutRef.current = setTimeout(() => {
//           setActiveIndex(index)
//           timeoutRef.current = null // 完成后清除引用
//         }, 200)
//       },
//       [setActiveIndex]
//     ) // 添加setActiveIndex到依赖项

//     // 切换文档时清理旧文档的缓存
//     useEffect(() => {
//       const currentDocumentId = `${docsPath}/${fileName}`

//       // 清除之前可能存在的清理定时器
//       if (cleanupTimerRef.current) {
//         clearTimeout(cleanupTimerRef.current)
//         cleanupTimerRef.current = null
//       }
//       // 重置当前文档的图片状态
//       hasImagesRef.current = false
//       // 只有当存在上一个文档ID且与当前文档不同时才清理，并且该文档包含图片时才清理
//       if (
//         previousDocumentIdRef.current &&
//         previousDocumentIdRef.current !== currentDocumentId &&
//         documentImagesMap.current.get(previousDocumentIdRef.current)
//       ) {
//         // 延迟清理上一个文档的图片缓存，确保新文档图片先加载
//         cleanupTimerRef.current = setTimeout(() => {
//           imageCache.clearDocumentImages(previousDocumentIdRef.current)
//           console.log(
//             `已延迟清理文档 ${previousDocumentIdRef.current} 的图片缓存`
//           )
//         }, 1000) // 1秒延迟
//       }

//       // 更新上一个文档ID为当前文档ID
//       previousDocumentIdRef.current = currentDocumentId

//       // 清理函数只在组件完全卸载时执行最终清理
//       return () => {
//         // 清理debounce的定时器
//         if (timeoutRef.current) {
//           clearTimeout(timeoutRef.current)
//         }

//         // 清理缓存清理定时器
//         if (cleanupTimerRef.current) {
//           clearTimeout(cleanupTimerRef.current)
//         }

//         // 组件完全卸载时，只有当文档包含图片时才延迟清理缓存
//         if (
//           previousDocumentIdRef.current === currentDocumentId &&
//           documentImagesMap.current.get(currentDocumentId)
//         ) {
//           cleanupTimerRef.current = setTimeout(() => {
//             imageCache.clearDocumentImages(currentDocumentId)
//             console.log(
//               `组件卸载，延迟清理文档 ${currentDocumentId} 的图片缓存`
//             )
//           }, 2000) // 2秒延迟，确保图片加载完成
//         }
//       }
//     }, [fileName, docsPath])

//     // 加载markdown内容 - 只在fileName变化时执行
//     const loadContent = useCallback(() => {
//       setIsContentLoaded(false)
//       fetch(`${docsPath}/${fileName}`)
//         .then(r => r.text())
//         .then(src => {
//           // 只保存HTML内容，不直接触发状态更新
//           const html = md.render(src)
//           htmlContentRef.current = html

//           // 解析标题列表
//           const parser = new DOMParser()
//           const doc = parser.parseFromString(html, 'text/html')
//           const hs = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
//           const newHeadings = hs.map((h, i) => ({
//             level: parseInt(h.tagName[1]),
//             text: h.textContent ?? `标题 ${(i + 1).toString()}`,
//             index: i
//           }))

//           // 更新标题列表状态
//           setHeadings(newHeadings)
//           setIsContentLoaded(true)
//         })
//         .catch(() => {
//           htmlContentRef.current = '<p>加载失败</p>'
//           setIsContentLoaded(true)
//         })
//     }, [fileName, docsPath])

//     // 仅在fileName变化时加载内容
//     useEffect(() => {
//       loadContent()
//       // 监听HMR
//       if (import.meta.hot) {
//         import.meta.hot.on('vite:beforeUpdate', loadContent)
//       }
//     }, [loadContent])

//     // 渲染内容到DOM - 只在内容加载完成后执行一次
//     useEffect(() => {
//       if (!articleRef.current || !htmlContentRef.current || !isContentLoaded)
//         return

//       // 直接操作DOM，避免使用dangerouslySetInnerHTML导致的重解析
//       articleRef.current.innerHTML = htmlContentRef.current

//       // 处理图片 - 拦截原生图片加载
//       const images =
//         articleRef.current.querySelectorAll<HTMLImageElement>('img')
//       const documentId = `${docsPath}/${fileName}`
//       // 检查是否有图片
//       hasImagesRef.current = images.length > 0
//       documentImagesMap.current.set(documentId, hasImagesRef.current)

//       // 如果没有图片，直接退出图片处理逻辑
//       if (!hasImagesRef.current) {
//         console.log(`文档 ${documentId} 不包含图片，跳过缓存处理`)
//       } else {
//         // 图片处理部分
//         images.forEach(img => {
//           const src = img.src

//           // 使用缓存管理器，传入documentId
//           if (imageCache.has(src, documentId)) {
//             console.log(`图片 ${src} 已缓存，直接加载`)
//             // 已缓存的图片优化加载属性
//             img.setAttribute('loading', 'lazy')
//             img.setAttribute('decoding', 'async')
//             // 可以添加缓存标记便于调试
//             img.dataset.fromCache = 'true'
//           } else {
//             // 对于新图片，预加载并添加到缓存
//             const preloadImg = new Image()
//             preloadImg.src = src
//             preloadImg.onload = () => {
//               // 添加documentId参数
//               imageCache.add(src, documentId)
//               console.log(`已缓存图片 ${src}`)
//               // 添加加载完成标记
//               img.dataset.loaded = 'true'
//             }

//             // 添加错误处理
//             preloadImg.onerror = () => {
//               console.warn(`图片加载失败: ${src}`)
//               img.dataset.loadingError = 'true'
//             }
//           }
//         })
//       }
//       // 更新headingsRef
//       const headingElements = Array.from(
//         articleRef.current.querySelectorAll<HTMLHeadingElement>(
//           'h1,h2,h3,h4,h5,h6'
//         )
//       )
//       headingsRef.current = headingElements

//       // 为每个标题添加data-index属性
//       headingElements.forEach((heading, index) => {
//         heading.setAttribute('data-index', index.toString())
//       })
//     }, [isContentLoaded, fileName, docsPath])

//     // 优化2: 设置IntersectionObserver观察标题位置，使用节流优化滚动处理
//     useEffect(() => {
//       if (!containerRef.current || headingsRef.current.length === 0) return

//       // 清理之前的观察器
//       if (observerRef.current) {
//         observerRef.current.disconnect()
//       }

//       // 创建新的观察器
//       observerRef.current = new IntersectionObserver(
//         throttle(entries => {
//           // 找出当前最靠近视口顶部的标题
//           const visibleEntries = entries.filter(entry => entry.isIntersecting)

//           if (visibleEntries.length > 0) {
//             // 优先选择最靠近顶部的可见元素
//             visibleEntries.sort((a, b) => {
//               return a.boundingClientRect.top - b.boundingClientRect.top
//             })
//             const currentIndex = Number(
//               visibleEntries[0].target.getAttribute('data-index')
//             )

//             // 使用防抖更新活动索引
//             debouncedSetActiveIndex(currentIndex)
//           } else {
//             // 没有可见元素时，基于滚动位置计算
//             const scrollTop = containerRef.current?.scrollTop ?? 0
//             let closestIndex = 0
//             let minDistance = Infinity

//             headingsRef.current.forEach((heading, index) => {
//               const headingTop = heading.offsetTop
//               const distance = Math.abs(headingTop - scrollTop - 120)
//               if (distance < minDistance) {
//                 minDistance = distance
//                 closestIndex = index
//               }
//             })

//             // 使用防抖更新活动索引
//             debouncedSetActiveIndex(closestIndex)
//           }
//         }, 100), // 100ms节流
//         {
//           root: containerRef.current,
//           rootMargin: '-50px 0px -70% 0px',
//           threshold: 0.2
//         }
//       )

//       // 观察所有标题
//       headingsRef.current.forEach(heading => {
//         observerRef.current?.observe(heading)
//       })

//       // 清理函数 - 只在该useEffect作用域内清理observer
//       return () => {
//         if (observerRef.current) {
//           observerRef.current.disconnect()
//           observerRef.current = null
//         }
//       }
//     }, [headingsRef.current.length, debouncedSetActiveIndex])

//     // 滚动到指定标题
//     const scrollToHeading = useCallback((index: number) => {
//       const el = headingsRef.current[index]
//       if (!containerRef.current) return

//       // 计算滚动位置
//       const containerRect = containerRef.current.getBoundingClientRect()
//       const elementRect = el.getBoundingClientRect()
//       const relativeTop = elementRect.top - containerRect.top
//       const scrollPosition = containerRef.current.scrollTop + relativeTop - 120

//       // 滚动到目标位置
//       containerRef.current.scrollTo({
//         top: Math.max(0, scrollPosition),
//         behavior: 'smooth'
//       })

//       // 立即更新活动索引
//       setActiveIndex(index)
//     }, [])

//     return (
//       <Container style={{ height: containerHeight }}>
//         {/* 滚动容器 */}
//         <ScrollHost isTocExpanded={isTocExpanded} ref={containerRef}>
//           {/* 使用ref而不是state来渲染内容 */}
//           <StyledArticle className="markdown-body" ref={articleRef} />
//         </ScrollHost>

//         {/* 目录组件 */}
//         <TableOfContents
//           key={fileName}
//           headings={headings}
//           onItemClick={scrollToHeading}
//           activeIndex={activeIndex} // 确保目录高亮功能
//           onExpandedChange={setIsTocExpanded}
//         />
//       </Container>
//     )
//   }
// )

// export default MarkdownReader
