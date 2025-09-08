// 使用 Vite 插件把 docs 目录映射成可访问路径
import { readFileSync, createReadStream, statSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'
/**
 * 同时支持
 *  - /docs/xxx.md   （文本，text/markdown）
 *  - /images/xxx.*  （二进制图片）
 *  文件放在
 *    src/assets/docs/
 *    src/assets/docs/images/
 */

export default function serveDocsImages(): Plugin {
  return {
    name: 'serve-docs-images',
    apply: 'serve', // 仅 dev 模式生效
    configureServer(server) {
      /* -------- 1. Markdown 文件 -------- */
      server.middlewares.use('/docs', (req, res, next) => {
        if (!req.url) {
          next()
          return
        }

        // 关键修复：把 %20 等还原成空格
        const rawName = decodeURIComponent(req.url.slice(1))
        const file = resolve('src/assets/docs', rawName)

        try {
          const content = readFileSync(file, 'utf-8')
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
          res.end(content)
        } catch {
          res.statusCode = 404
          res.end('Not found')
          next() // 交给下一条规则（或 404）
        }
      })

      /* -------- 2. 图片资源 -------- */
      server.middlewares.use('/images', (req, res, next) => {
        if (!req.url) {
          next()
          return
        }

        const rawName = decodeURIComponent(req.url.slice(1))
        const file = resolve('src/assets/docs/images', rawName)

        try {
          const st = statSync(file)
          if (!st.isFile()) {
            next()
            return
          }

          res.setHeader('Cache-Control', 'max-age=3600')
          createReadStream(file).pipe(res)
        } catch {
          res.statusCode = 404
          res.end('Not found')
        }
      })
    }
  }
}
