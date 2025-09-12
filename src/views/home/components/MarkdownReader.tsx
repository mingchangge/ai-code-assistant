import { useEffect, useState, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import styled from 'styled-components'
import 'github-markdown-css/github-markdown.css'

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
    /* 足够大，保证移动空间  */
    background-size: 200% 200%;
    animation: flow 4s linear infinite;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 3.2rem;
    font-weight: 900;
    /* 优化多行文本的排版平衡，使段落的各行长度更加均匀，避免出现单字成行或某一行明显过短的情况 */
    text-wrap: balance;
  }

  /* H2短标题 - 紫色到亮黄的渐变 */
  h2 {
    background: linear-gradient(183deg, #0066ff 17%, #00cc99 72%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 2.4rem;
    font-weight: 800;
    background-size: 100% 200%; /* 垂直方向扩展渐变范围 */
    /* 优化多行文本的排版平衡，使段落的各行长度更加均匀，避免出现单字成行或某一行明显过短的情况 */
    text-wrap: balance;
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
    /* 优化多行文本的排版平衡，使段落的各行长度更加均匀，避免出现单字成行或某一行明显过短的情况 */
    text-wrap: balance;
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
    } /* 回到起点，无缝衔接 */
  }
`

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
})
interface Props {
  fileName: string
}

// markdown 文件预览
const MarkdownReader = ({ fileName }: Props) => {
  const [html, setHtml] = useState<string>('')

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/docs/${fileName}`)
      const src = await res.text()
      setHtml(md.render(src))
    } catch {
      setHtml('<p>加载失败</p>')
    }
  }, [fileName])

  useEffect(() => {
    void load()

    // 监听 HMR：vite 文件变动后触发
    if (import.meta.hot) {
      import.meta.hot.on('vite:beforeUpdate', () => void load())
    }
  }, [load])

  return (
    <StyledArticle
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default MarkdownReader
