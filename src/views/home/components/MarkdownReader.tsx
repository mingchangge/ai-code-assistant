import { useEffect, useState } from 'react'
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
  mdUrl: string
}

const MarkdownReader = ({ mdUrl }: Props) => {
  const [html, setHtml] = useState('')

  useEffect(() => {
    void fetch(mdUrl)
      .then(r => r.text())
      .then(src => {
        setHtml(md.render(src))
      })
  }, [mdUrl])

  return (
    <StyledArticle
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default MarkdownReader
