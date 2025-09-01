# markdown笔记文件在项目页面中展示

- 插件应用在 home 页面
- 项目页面中展示markdown文件，需要安装插件**markdown-it**，安装命令：`npm i markdown-it@^14 @types/markdown-it@^14 -D`
- 安装完成后，在项目中引入插件

  ```tsx
  import MarkdownIt from 'markdown-it'
  ```

- 引入插件后，创建一个markdown实例：

  ```tsx
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  })
  ```

- 引入完成后，在项目中使用markdown实例渲染markdown文件：

  ```tsx
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
  ```

- markdown-it 默认只输出「裸」HTML，没有附带任何 CSS 样式。
- 为了使渲染的 Markdown 内容更美观，我们需要引入一些 CSS 样式。
- 一种简单的方法是使用 GitHub 风格的 Markdown 渲染器，它会自动添加必要的 CSS 样式。
- 我们可以安装 `markdown-it-github` 插件来实现这个功能，安装命令：`npm i -D github-markdown-css`。
- 安装完成后，在项目中引入插件：
  ```tsx
  import 'github-markdown-css/github-markdown.css'
  ```
- css 样式引入完成后，在项目中直接使用`className="markdown-body"`即可。
- 渲染完成后，页面中展示的 markdown 文件就会有 GitHub 风格的样式了。
- 最后，我们可以在父组件中使用 `MarkdownReader` 组件来展示 markdown 文件：
  ```tsx
  import MarkdownReader from './MarkdownReader'
  ;<MarkdownReader mdUrl="/path/to/markdown.md" />
  ```
