import { useEffect, useState, useCallback } from 'react'
import MarkdownIt from 'markdown-it'
import styled from 'styled-components'
import 'github-markdown-css/github-markdown.css'

const StyledArticle = styled.article`
  width: 100%;
  height: 100%;
  /* H1短标题 - 红到蓝的强烈渐变 */
  h1 {
    background: linear-gradient(18deg, #ff3366 13%, #9900cc 68%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 3.2rem;
    font-weight: 900;
    background-size: 100% 200%; /* 垂直方向扩展渐变范围 */
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
    background-size: 100% 200%;
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
