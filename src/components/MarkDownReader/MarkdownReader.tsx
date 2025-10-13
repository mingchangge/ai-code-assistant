import { useEffect, useState, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import styled from 'styled-components'
import TableOfContents from './TableOfContents'
import 'github-markdown-css/github-markdown.css'

const Container = styled.div.withConfig({
  shouldForwardProp: prop => !['isTocExpanded'].includes(prop)
})<{ isTocExpanded: boolean }>`
  display: flex;
  width: 100%;
  height: 100%;
  position: relative;

  .article-container {
    flex: 1;
    max-width: 100%;
    padding-right: ${props =>
      props.isTocExpanded ? '320px' : '0'}; /* 根据目录展开状态动态调整 */

    @media (max-width: 1200px) {
      padding-right: 0;
    }
  }
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

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})

interface Props {
  fileName: string
  docsPath?: string
  showToc?: boolean // 是否显示目录
}

/**
 * Markdown阅读器组件 - 支持目录功能
 * @param fileName - 文件名
 * @param docsPath - 文档路径，默认为'/docs'
 * @param showToc - 是否显示目录，默认为true
 */
const MarkdownReader = ({
  fileName,
  docsPath = '/docs',
  showToc = true
}: Props) => {
  const [html, setHtml] = useState<string>('')
  const [isTocExpanded, setIsTocExpanded] = useState<boolean>(false) // 添加目录展开状态

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${docsPath}/${fileName}`)
      const src = await res.text()
      setHtml(md.render(src))
    } catch {
      setHtml('<p>加载失败</p>')
    }
  }, [fileName, docsPath])

  useEffect(() => {
    void load()

    // 监听 HMR：vite 文件变动后触发
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => void load())
    }
  }, [load])

  // 处理目录项点击
  const handleTocItemClick = (id: string) => {
    console.log(`跳转到章节: ${id}`)
  }

  // 处理目录展开状态变化
  const handleTocToggle = (expanded: boolean) => {
    setIsTocExpanded(expanded)
  }
  return (
    <Container isTocExpanded={isTocExpanded}>
      <div className="article-container">
        <StyledArticle
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>

      {/* 条件渲染目录组件 */}
      {showToc && html && (
        <TableOfContents
          html={html}
          onItemClick={handleTocItemClick}
          onToggle={handleTocToggle}
        />
      )}
    </Container>
  )
}

export default MarkdownReader
