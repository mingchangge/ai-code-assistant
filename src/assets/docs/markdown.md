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

## 构建保存修改时实时预览markdown阅读器-第一种方案可行，第二种方案不可行

- (✅)开发时写插件，把任意目录映射成 URL
  - 在 `vite.config.ts` plugins配置中新增**serve-docs-images**

    ```ts
    ...
    plugins: [
      ...
      {
        name: 'serve-docs-images',
        apply: 'serve', // 只在 dev server 生效
        configureServer(server) {
          // 1️⃣ Markdown 文件
          server.middlewares.use('/docs', (req, res, next) => {
            if (!req.url) {
              next()
              return
            }
            // 去掉首字母 /，拼成文件系统路径
            const file = resolve('src/assets/docs', req.url.slice(1))
            try {
              const content = readFileSync(file, 'utf-8')
              res.setHeader('Content-Type', 'text/markdown')
              res.end(content)
            } catch {
              next() // 交给下一条规则（图片）
            }
          })

          // 2️⃣ 图片资源
          server.middlewares.use('/images', (req, res, next) => {
            if (!req.url) {
              next()
              return
            }
            // 去掉首字母 /，拼成文件系统路径
            const file = resolve('src/assets/docs/images', req.url.slice(1))
            try {
              const stat = statSync(file)
              if (!stat.isFile()) {
                next()
                return
              }
              // 让浏览器按二进制流下载
              const stream = createReadStream(file)
              stream.pipe(res)
            } catch {
              res.statusCode = 404
              res.end('Not found')
            }
          })
        }
      }
    ],
    ```

  - 组件监听 HMR 事件(**src/components/MarkdownReader.tsx**)

    ```tsx
    ...
    const MarkdownReader: React.FC<Props> = ({ fileName }) => {
      const [html, setHtml] = useState<string>('')

      const load = async () => {
        try {
          const res = await fetch(`/docs/${fileName}`)
          const src = await res.text()
          setHtml(md.render(src))
        } catch {
          setHtml('<p>加载失败</p>')
        }
      }

      useEffect(() => {
        load()

        // 监听 HMR：vite 会把 /docs/** 当作模块，文件改动会触发 update
        if (import.meta.hot) {
          import.meta.hot.on('vite:beforeUpdate', () => load())
        }
      }, [fileName])

    ...
    ```

  - 父组件保持不变, `src/components/MdTabs.tsx` 里只要把 `mdUrl` 换成 `fileName` 即可：

    ```tsx
    ...
    children: <MarkdownReader fileName={fileName} />
    ```

- (❌)把 `src/assets/docs` 目录**声明成 Vite “公共”目录**，利用 Vite 的 **HMR（热更新）** 机制，文件一变动就**自动触发 fetch**，阅读器实时刷新，**无需改 docs 路径**。
  - 声明目录为 `public`（不改物理位置）

    ```ts
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'

    export default defineConfig({
      plugins: [react()],
      // 把 src/assets/docs 当作 /docs 暴露出来
      publicDir: 'src/assets/docs'
    })
    ```

  - 修改`vite.config.ts`文件，增加`publicDir: 'src/assets/docs'`报错：
    ![alt text](./images/image2.png)
