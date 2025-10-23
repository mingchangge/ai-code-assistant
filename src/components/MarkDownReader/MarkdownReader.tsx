import { useEffect, useRef, useState, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import styled from 'styled-components'
import TableOfContents from './TableOfContents'
import 'github-markdown-css/github-markdown.css'

const md = new MarkdownIt({ html: true, linkify: true, typographer: true })

const Container = styled.div`
  display: flex;
  width: 100%;
  height: calc(100vh - 168px);
`
const ScrollHost = styled.div.withConfig({
  shouldForwardProp: prop => !['isTocExpanded'].includes(prop)
})<{ isTocExpanded: boolean }>`
  flex: 1;
  overflow-y: auto;
  height: 100%;
  padding-right: ${p => (p.isTocExpanded ? '300px' : '24px')};
`

const StyledArticle = styled.article`
  width: 100%;
  height: 100%;

  /* H1短标题 - 红到蓝的强烈渐变 */
  h1 {
    background:
      radial-gradient(
        circle at 50% 0,
        rgba(255, 0, 0, 0.5),
        rgba(255, 0, 0, 0) 70.71%
      ),
      radial-gradient(
        circle at 6.7% 75%,
        rgba(0, 0, 255, 0.5),
        rgba(0, 0, 255, 0) 70.71%
      ),
      radial-gradient(
        circle at 93.3% 75%,
        rgba(0, 255, 0, 0.5),
        rgba(0, 255, 0, 0) 70.71%
      ),
      beige;
    background-size: 200% 200%;
    animation: flow 4s linear infinite;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 3.2rem;
    font-weight: 900;
    text-wrap: balance;
    scroll-margin-top: 100px; /* 增加滚动偏移 */
  }

  /* H2短标题 - 紫色到亮黄的渐变 */
  h2 {
    background: linear-gradient(183deg, #0066ff 17%, #00cc99 72%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 2.4rem;
    font-weight: 800;
    background-size: 100% 200%;
    text-wrap: balance;
    scroll-margin-top: 100px;
  }

  /* H3短标题 - 深绿到亮橙的渐变 */
  h3 {
    background: linear-gradient(183deg, #ff6600 17%, #ffcc00 72%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 2rem;
    font-weight: 700;
    background-size: 100% 200%;
    text-wrap: balance;
    scroll-margin-top: 100px;
  }

  /* 为所有标题添加样式 */
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    position: relative;
    scroll-margin-top: 100px; /* 增加滚动偏移，避免被固定导航栏遮挡 */

    &:hover::before {
      content: '#';
      position: absolute;
      left: -24px;
      color: #1890ff;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    &:hover::before {
      opacity: 1;
    }
  }

  img {
    width: 100%;
  }

  @keyframes flow {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`
interface TocItem {
  index: number
  text: string
  level: number
}
interface Props {
  fileName: string
  docsPath?: string
}

export default function MarkdownReader({
  fileName,
  docsPath = '/docs'
}: Props) {
  const [html, setHtml] = useState('')
  const [headings, setHeadings] = useState<TocItem[]>([])
  const headingsRef = useRef<HTMLHeadingElement[]>([]) // ★ 收集标题 DOM
  const containerRef = useRef<HTMLDivElement>(null) // ★ 滚动容器
  const [activeIndex, setActiveIndex] = useState(0) // ★ 当前活动标题索引
  const [isTocExpanded, setIsTocExpanded] = useState(false) // ★ 目录是否展开状态
  const [isContentLoaded, setIsContentLoaded] = useState(false) // ★ 内容加载状态

  // ★ 加载 markdown 内容的函数
  const load = useCallback(() => {
    // 重置状态
    setActiveIndex(0)
    setIsContentLoaded(false)
    fetch(`${docsPath}/${fileName}`)
      .then(r => r.text())
      .then(src => {
        const html = md.render(src)
        setHtml(html)

        // ★ 从 markdown 字符串里提前解析出标题列表（给目录用）
        const parser = new DOMParser()
        const doc = parser.parseFromString(html, 'text/html')
        const hs = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
        const newHeadings = hs.map((h, i) => ({
          level: parseInt(h.tagName[1]),
          text: h.textContent ?? `标题 ${(i + 1).toString()}`,
          index: i
        }))
        setHeadings(newHeadings)
        setIsContentLoaded(true)
      })
      .catch(() => {
        setHtml('<p>加载失败</p>')
        setIsContentLoaded(true)
      })
  }, [fileName, docsPath])
  // 加载 markdown
  useEffect(() => {
    load()
    // 监听 HMR：vite 文件变动后触发重新加载
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => {
        load()
      })
    }
    // fetch(`${docsPath}/${fileName}`)
    //   .then(r => r.text())
    //   .then(src => {
    //     const html = md.render(src)
    //     setHtml(html)

    //     // ★ 从 markdown 字符串里提前解析出标题列表（给目录用）
    //     const parser = new DOMParser()
    //     const doc = parser.parseFromString(html, 'text/html')
    //     const hs = Array.from(doc.querySelectorAll('h1,h2,h3,h4,h5,h6'))
    //     setHeadings(
    //       hs.map((h, i) => ({
    //         level: parseInt(h.tagName[1]),
    //         text: h.textContent ?? `标题 ${(i + 1).toString()}`,
    //         index: i
    //       }))
    //     )
    //   })
    //   .catch(() => {
    //     setHtml('<p>加载失败</p>')
    //   })
  }, [load])
  // ① 收集标题 DOM 后启动观察
  useEffect(() => {
    if (
      !containerRef.current ||
      !headingsRef.current.length ||
      !isContentLoaded
    )
      return
    const io = new IntersectionObserver(
      entries => {
        // 找出当前最靠近视口顶部的标题
        let currentActiveIndex = activeIndex
        const visibleEntries = entries.filter(entry => entry.isIntersecting)

        if (visibleEntries.length > 0) {
          // 优先选择最靠近顶部的可见元素
          visibleEntries.sort((a, b) => {
            const topA = a.boundingClientRect.top
            const topB = b.boundingClientRect.top
            return topA - topB // 修复：直接使用top值排序，选择最靠近顶部的
          })
          currentActiveIndex = Number(
            visibleEntries[0].target.getAttribute('data-index')
          )
        } else {
          // 没有可见元素时，改进逻辑：选择滚动位置对应的标题
          const scrollTop = containerRef.current?.scrollTop ?? 0
          let closestIndex = 0
          let minDistance = Infinity

          headingsRef.current.forEach((heading, index) => {
            const headingTop = heading.offsetTop
            const distance = Math.abs(headingTop - scrollTop - 120) // 120是固定头高度
            if (distance < minDistance) {
              minDistance = distance
              closestIndex = index
            }
          })
          currentActiveIndex = closestIndex
        }

        // 只有当索引确实变化时才更新状态，避免不必要的重渲染
        if (currentActiveIndex !== activeIndex) {
          setActiveIndex(currentActiveIndex)
        }
      },
      {
        root: containerRef.current, // 修复：使用滚动容器作为根
        rootMargin: '0px', // 修复：使用更简单的margin配置
        threshold: 0.5 // 修复：提高阈值，确保元素真正可见
      }
    )

    headingsRef.current.forEach((h, i) => {
      h.setAttribute('data-index', String(i))
      io.observe(h)
    })

    return () => {
      io.disconnect()
    }
  }, [headingsRef.current.length, isContentLoaded, activeIndex]) // 文章变化后重新观察
  // ★ 把“滚动到第几个标题”暴露给目录
  const scrollToHeading = useCallback((index: number) => {
    const el = headingsRef.current[index]
    if (!containerRef.current) return

    // 计算元素相对于容器顶部的偏移量
    const containerRect = containerRef.current.getBoundingClientRect()
    const elementRect = el.getBoundingClientRect()
    const relativeTop = elementRect.top - containerRect.top
    const scrollPosition = containerRef.current.scrollTop + relativeTop - 120
    containerRef.current.scrollTo({
      top: Math.max(0, scrollPosition),
      behavior: 'smooth'
    })
  }, [])

  return (
    <Container>
      <ScrollHost isTocExpanded={isTocExpanded} ref={containerRef}>
        <StyledArticle
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
          ref={el => {
            // ★ 动态 ref：每渲染一次就重新收集标题 DOM
            headingsRef.current = []
            if (!el) return
            const hs =
              el.querySelectorAll<HTMLHeadingElement>('h1,h2,h3,h4,h5,h6')
            hs.forEach((h, i) => (headingsRef.current[i] = h))
          }}
        />
      </ScrollHost>

      <TableOfContents
        key={fileName}
        headings={headings}
        onItemClick={scrollToHeading}
        activeIndex={activeIndex} // ★ 实时高亮索引
        onExpandedChange={setIsTocExpanded} // ★ 目录展开状态回调
      />
    </Container>
  )
}
