// 使用 Vite 插件把 docs 目录映射成可访问路径
import { readFileSync, createReadStream, statSync, existsSync } from 'fs'
import { resolve } from 'path'
import type { Plugin } from 'vite'
/**
 * 同时支持
 *  - /docs/xxx.md   （文本，text/markdown）
 *  - /images/xxx.*  （二进制图片）
 *  或其他自定义路径
 *  文件放在
 *    src/assets/docs/
 *    src/assets/docs/images/
 */

// 定义配置接口
interface ServeDocsImagesOptions {
  /**
   * 基础路径映射规则
   * 默认情况下，会将 /path 映射到 src/path
   */
  basePath?: string
  /**
   * 自定义路径映射函数
   * 可以根据请求路径动态计算本地路径
   */
  pathMapper?: (requestPath: string) => string
}

export default function serveDocsImages(
  options: ServeDocsImagesOptions = {}
): Plugin {
  // 默认配置
  const basePath = options.basePath ?? 'src'

  // 路径映射函数
  const mapPath =
    options.pathMapper ??
    ((requestPath: string) => {
      // 默认映射规则：将 /path 映射到 src/path
      // 例如：/docs -> src/docs
      //       /views/IPFS -> src/views/IPFS
      return resolve(basePath, requestPath.slice(1))
    })

  return {
    name: 'serve-docs-images',
    apply: 'serve', // 仅 dev 模式生效
    configureServer(server) {
      /* -------- 1. Markdown 文件 -------- */
      server.middlewares.use((req, res, next) => {
        if (!req.url) {
          next()
          return
        }
        // 获取请求路径
        const requestUrl = decodeURIComponent(req.url)
        // 非md文件请求不处理
        if (!requestUrl.endsWith('.md')) {
          next()
          return
        }

        // 提取路径部分和文件名部分
        const pathParts = requestUrl.split('/').filter(Boolean)
        const fileName = pathParts.pop() ?? ''
        const dirPath = '/' + pathParts.join('/')

        // 映射到本地文件路径
        const localDir = mapPath(dirPath)
        const file = resolve(localDir, fileName)
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
        console.log('req.url', req.url)
        if (!req.url) {
          next()
          return
        }

        const rawName = decodeURIComponent(req.url.slice(1))
        // 首先尝试从当前MD文件所在目录下的images文件夹查找
        const imageDirs = []
        // 从请求中获取MD文件目录（如果可用）
        if (req.headers.referer) {
          try {
            const referer = new URL(req.headers.referer)
            console.log('referer', referer)
            const pathname = referer.pathname
            console.log('referer.pathname', pathname)
            //将referer.pathname的图片路径可能性拼接成数组
            const pathArray = [
              `/views/${pathname}/docs/images`,
              `/views/${pathname}/images`
            ]
            // 遍历pathArray，将每个路径映射到本地目录
            pathArray.forEach(path => {
              const localDir = mapPath(path)
              imageDirs.push(localDir)
            })
          } catch (error) {
            console.error('解析 referer URL 失败:', error)
          }
        }
        // 添加默认的images目录
        imageDirs.push(resolve('src/assets/docs/images'))

        // 尝试在每个可能的目录中查找图片
        for (const imageDir of imageDirs) {
          const file = resolve(imageDir, rawName)

          try {
            if (existsSync(file) && statSync(file).isFile()) {
              res.setHeader('Cache-Control', 'max-age=3600')
              createReadStream(file).pipe(res)
              return // 找到图片后直接返回
            }
          } catch {
            // 忽略错误，继续尝试下一个目录
          }
        }

        // 所有目录都没找到
        res.statusCode = 404
        res.end('Image not found')
        next()
      })
    }
  }
}
